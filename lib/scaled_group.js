"use strict";

let _ = require("underscore");
let Spritesheet = require("./spritesheet");

module.exports = class ScaledGroup {
    constructor(scaledSprites, groupHash, scaleName, groupConfig, config, cache, cachePath, imageProcessor) {
        this.scaledSprites = scaledSprites;
        this.groupHash = groupHash;
        this.groupConfig = groupConfig;
        this.config = config;
        this.cache = cache;
        this.cachePath = cachePath;
        this.imageProcessor = imageProcessor;
        this.scaleName = scaleName;
        this.groupId = groupConfig.id;
        this.spritesheets = [];
    }

    createAndProcessSpritesheets() {
        let remainingScaledSprites = _.clone(this.scaledSprites); // shallow clone
        let i = 0;

        while (remainingScaledSprites.length) {
            let remainingPixels = this.config.max_pixels_per_sprite_sheet.soft;
            let scaledSpritesForSpritesheet = [];

            while(remainingScaledSprites.length && remainingPixels > remainingScaledSprites[0].pixelCount) {
                let nextScaledSprite = remainingScaledSprites.shift();
                remainingPixels -= nextScaledSprite.width * nextScaledSprite.height;
                scaledSpritesForSpritesheet.push(nextScaledSprite);
            }

            if (scaledSpritesForSpritesheet.length === 0) {
                if (remainingScaledSprites[0].pixelCount <= this.config.max_pixels_per_sprite_sheet.hard) {
                    scaledSpritesForSpritesheet.push(remainingScaledSprites.shift());
                } else {
                    throw new Error("Single scaled sprite is too large for spritesheet: " +
                        remainingScaledSprites[0].sprite.name + " @ " +
                        remainingScaledSprites[0].scaleName +
                        "(" + remainingScaledSprites[0].width + "x" + remainingScaledSprites[0].height + ")");
                }
            }

            let name = "spritesheet_" + this.groupHash + "_" + this.scaleName + "_" + i;
            this.spritesheets.push(new Spritesheet(name, scaledSpritesForSpritesheet, this.groupConfig, this.config, this.cache, this.cachePath, this.imageProcessor));
            i++;
        }

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
