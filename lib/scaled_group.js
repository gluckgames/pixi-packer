"use strict";

let _ = require("underscore");
let Spritesheet = require("./spritesheet");
let MultiBinPacker = require("multi-bin-packer");

module.exports = class ScaledGroup {
    constructor(scaledSprites, groupHash, scaleName, groupConfig, config, cache, cachePath, imageProcessor, log) {
        this.scaledSprites = scaledSprites;
        this.groupHash = groupHash;
        this.groupConfig = groupConfig;
        this.config = config;
        this.cache = cache;
        this.cachePath = cachePath;
        this.imageProcessor = imageProcessor;
        this.scaleName = scaleName;
        this.groupId = groupConfig.id;
        this.log = log;
        this.spritesheets = [];
    }

    createAndProcessSpritesheets() {
        let packer = new MultiBinPacker(this.groupConfig.max_width, this.groupConfig.max_height, this.groupConfig.padding);
        packer.addArray(this.scaledSprites.map(scaledSprite => {
            return {
                width: scaledSprite.trim ? scaledSprite.trim.width : scaledSprite.width,
                height: scaledSprite.trim ? scaledSprite.trim.height : scaledSprite.height,
                data: scaledSprite
            };
        }));

        if (this.groupConfig.oversized_warning) {
            packer.bins.map(bin => {
                if (bin.rects[0].oversized) {
                    this.log.warn("Oversized sprite: " + bin.rects[0].data.sprite.name +
                        " at scale " + this.scaleName +
                        " with size " + bin.rects[0].width + "x" + bin.rects[0].height );
                }
            })
        }

        this.spritesheets = packer.bins.map((bin, i) => {
            let name = "spritesheet_" + this.groupHash + "_" + this.scaleName + "_" + i;
            return new Spritesheet(name, bin, this.groupConfig, this.config, this.cache, this.cachePath, this.imageProcessor);
        });

        return Promise.all(_.invoke(this.spritesheets, "process"));
    }

    process() {
        return this.createAndProcessSpritesheets()
        .then(() => this);
    }

    copy(outputPath) {
        return Promise.all(_.invoke(this.spritesheets, "copy", outputPath));
    }

    getImagePaths() {
        return _.pluck(this.spritesheets, "basename");
    }

    getOutputFilesize() {
        return _.reduce(this.spritesheets, (memo, spritesheet) => memo + spritesheet.outputFilesize, 0);
    }
};
