"use strict";

var Q = require("q");
var _ = require("underscore");
var Spritesheet = require("./spritesheet");

module.exports = function ScaledGroup(scaledSprites, groupHash, scaleName, groupConfig, config, cache, cachePath, imageProcessor) {
    var that = this;
    that.scaleName = scaleName;
    that.groupId = groupConfig.id;
    that.spritesheets = [];

    function createAndProcessSpritesheets() {
        var remainingScaledSprites = _.clone(scaledSprites); // shallow clone
        var i = 0;

        while (remainingScaledSprites.length) {
            var remainingPixels = config.max_pixels_per_sprite_sheet.soft;
            var scaledSpritesForSpritesheet = [];

            while(remainingScaledSprites.length && remainingPixels > remainingScaledSprites[0].getPixelCount()) {
                var nextScaledSprite = remainingScaledSprites.shift();
                remainingPixels -= nextScaledSprite.width * nextScaledSprite.height;
                scaledSpritesForSpritesheet.push(nextScaledSprite);
            }

            if (scaledSpritesForSpritesheet.length === 0) {
                if (remainingScaledSprites[0].getPixelCount() <= config.max_pixels_per_sprite_sheet.hard) {
                    scaledSpritesForSpritesheet.push(remainingScaledSprites.shift());
                } else {
                    throw new Error("Single scaled sprite is too large for spritesheet: " +
                        remainingScaledSprites[0].sprite.name + " @ " +
                        remainingScaledSprites[0].scaleName +
                        "(" + remainingScaledSprites[0].width + "x" + remainingScaledSprites[0].height + ")");
                }
            }

            var name = "spritesheet_" + groupHash + "_" + scaleName + "_" + i;
            that.spritesheets.push(new Spritesheet(name, scaledSpritesForSpritesheet, groupConfig, config, cache, cachePath, imageProcessor));
            i++;
        }

        return Q.all(_.invoke(that.spritesheets, "process"));
    }

    that.process = function() {
        return createAndProcessSpritesheets()
        .then(function() { return that; });
    };

    that.copy = function(outputPath) {
        return Q.all(_.invoke(that.spritesheets, "copy", outputPath));
    };

    that.getImagePaths = function() {
        return _.pluck(that.spritesheets, "basename");
    };

    that.getOutputFilesize = function() {
        return _.reduce(that.spritesheets, function(memo, spritesheet) { return memo + spritesheet.outputFilesize; }, 0);
    };
};
