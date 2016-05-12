"use strict";

var crypto = require("crypto");
var fs = require("fs-extra");
var promisify = require("es6-promisify");
var _ = require("underscore");
var path = require("path");

module.exports = class Spritesheet {
    constructor(name, scaledSprites, groupConfig, config, cache, cachePath, imageProcessor) {
        this.name = name;
        this.scaledSprites = scaledSprites;
        this.groupConfig = groupConfig;
        this.config = config;
        this.cache = cache;
        this.cachePath = cachePath;
        this.imageProcessor = imageProcessor;
    }

    getExtension() {
        return this.groupConfig.jpeg ? "jpeg" : "png";
    }

    copyFiles(outputPath) {
        var outputImagePath = outputPath + "/" + this.name + "." + this.getExtension();
        return promisify(fs.copy)(this.cachedImagePath, outputImagePath);
    }

    createImage(cachedImagePath) {
        var options = {
            algorithm: "binary-tree",
            padding: this.groupConfig.jpeg ? 4 : 1,
            engine: "gmsmith"
        };
        var src = _.pluck(this.scaledSprites, "path");

        return this.imageProcessor.spritesmith(options, src, cachedImagePath, this.groupConfig.jpeg, this.groupConfig.quality, this.groupConfig.compressor)
        .then(spritesmithResult => {
            if (this.config.max_pixels_per_sprite_sheet.hard < spritesmithResult.properties.width * spritesmithResult.properties.height) {
                throw new Error("Spritesheet " + this.name + "(" + _.pluck(this.scaledSprites, "path") + ") has breached the hard limit of max_pixels_per_sprite_sheet");
            }
            return spritesmithResult;
        });
    }

    createLoadingInformation(cachedImagePath, spritesmithResult) {
        return _.map(spritesmithResult.coordinates, (data, filename) => {
            var spriteHash = path.basename(filename).split("_")[2];
            var sprite = _.findWhere(_.pluck(this.scaledSprites, "sprite"), {hash: spriteHash});
            var scaledSprite = sprite.scaledSprites[this.scaledSprites[0].scaleName];
            var result = {
                "name": sprite.name,
                "position": {
                    "x": data.x,
                    "y": data.y
                },
                "dimension": {
                    "w": scaledSprite.width,
                    "h": scaledSprite.height
                }
            };

            if (scaledSprite.trim) {
                result.trim = {
                    "x": scaledSprite.trim.x,
                    "y": scaledSprite.trim.y,
                    "w": scaledSprite.trim.width,
                    "h": scaledSprite.trim.height
                };
            }

            return result;
        });
    }

    cacheMiss() {
        let cachedImagePath = path.join(this.cachePath, this.getBasename());
        return this.createImage(cachedImagePath)
        .then(result => {
            return Promise.all([
                this.createLoadingInformation(cachedImagePath, result),
                promisify(fs.stat)(cachedImagePath)
            ]);
        })
        .then(results => {
            let loadingInformation = results[0];
            let outputFilesize = results[1].size;
            return {cachedImagePath, loadingInformation, outputFilesize};
        });
    }

    cacheInterpret(data) {
        this.cachedImagePath = data.cachedImagePath;
        this.loadingInformation = data.loadingInformation;
        this.outputFilesize = data.outputFilesize;
    }

    getBasename() {
        return this.name + "." + this.getExtension();
    };

    calculateHash() {
        var hash = crypto.createHash("sha1");
        hash.update(_.pluck(this.scaledSprites, "path").sort().join(" ") + "_");
        hash.update(this.getExtension() + "_");
        hash.update((this.groupConfig.quality ? this.groupConfig.quality : "noquality") + "_");
        return this.name + "_" + hash.digest("hex");
    };

    process() {
        var hash = this.calculateHash();
        return this.cache.lookup("spritesheet", hash, this.cacheMiss.bind(this), 3)
        .then(this.cacheInterpret.bind(this))
        .then(() => this);
    };

    copy(outputPath) {
        return this.copyFiles(outputPath);
    };
};
