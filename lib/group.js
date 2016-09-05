"use strict";

let crypto = require("crypto");
let promisify = require("es6-promisify");
let glob = promisify(require("glob"));
let _ = require("underscore");
let Sprite = require("./sprite");
let ScaledGroup = require("./scaled_group");
let filesize = require("filesize");

module.exports = class Group {
    constructor(inputPath, groupConfig, config, cache, cachePath, imageProcessor, log) {
        this.inputPath = inputPath;
        this.config = config;
        this.groupConfig = groupConfig;
        this.id = groupConfig.id;
        this.jpeg = groupConfig.jpeg;
        this.variation = groupConfig.variation;
        this.quality = groupConfig.quality;
        this.compressor = groupConfig.compressor;
        this.loadingStage = groupConfig.loading_stage;
        this.cache = cache;
        this.cachePath = cachePath;
        this.imageProcessor = imageProcessor;
        this.log = log;
    }

    createAndProcessSprites(queue) {
        return Promise.all(this.groupConfig.sprites.map(pattern => {
            var fullPattern = this.inputPath + "/" + pattern;
            return glob(fullPattern)
            .then(paths => {
                if (paths.length === 0) {
                    this.log.warn("Group %s, Pattern %s yields no files", this.id, fullPattern);
                }
                return paths;
            });
        }))
        .then(paths => {
            paths = _.flatten(paths);

            return Promise.all(paths.map(path => {
                let sprite = new Sprite(this.inputPath, path, this.groupConfig, this.config, this.cache, this.cachePath, this.imageProcessor);
                return sprite.process(queue);
            }));
        });
    }

    calculateHash(sprites) {
        let hash = crypto.createHash("sha1");
        hash.update(_.pluck(sprites, "hash").sort().join(" "));
        hash.update(this.id || "");
        hash.update(this.jpeg ? "y" : "n");
        hash.update(this.quality ? this.quality + "" : "");
        hash.update(this.loading_stage || "");
        return hash.digest("hex");
    }

    createAndProcessScaledGroups(sprites, queue) {
        this.scaledGroups = _.map(this.config.scales, (scale, scaleName) => {
            let scaledSprites = sprites.map(sprite => {
                return sprite.scaledSprites[scaleName];
            });
            return new ScaledGroup(scaledSprites, this.hash, scaleName, this.groupConfig, this.config, this.cache, this.cachePath, this.imageProcessor, this.log);
        });
        return Promise.all(this.scaledGroups.map(scaledGroup => scaledGroup.process(queue)));
    }

    getScaledGroup(scaleName) {
        return _.findWhere(this.scaledGroups, {scaleName});
    };

    process(queue) {
        return this.createAndProcessSprites(queue)
        .then(sprites => {
            this.sprites = sprites;
            this.hash = this.calculateHash(sprites);
            return this.createAndProcessScaledGroups(sprites, queue);
        })
        .then(() => {
            this.log.info("Group %s", this.id);
            this.log.info("  %d sprites", this.sprites.length);
            _.each(this.scaledGroups, scaledGroup => {
                this.log.info("  %s: %d spritesheets, %s total",
                    scaledGroup.scaleName,
                    scaledGroup.spritesheets.length,
                    filesize(scaledGroup.getOutputFilesize()));
            });
            this.log.info("");

            return this;
        });
    };

    copy(outputPath) {
        return Promise.all(_.invoke(this.scaledGroups, "copy", outputPath));
    };
};
