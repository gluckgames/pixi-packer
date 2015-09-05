"use strict";

var fs = require("fs-extra");
var Q = require("q");
var _ = require("underscore");
var path = require("path");

module.exports = function Spritesheet(name, scaledSprites, groupConfig, config, cache, cachePath, imageProcessor) {
    var that = this;
    that.extension = groupConfig.jpeg ? "jpeg" : "png";
    that.basename = name + "." + that.extension;

    function copyFiles(outputPath) {
        var outputImagePath = outputPath + "/" + name + "." + that.extension;
        return Q.nfcall(fs.copy, that.cachedImagePath, outputImagePath);
    }

    function createImage(cachedImagePath) {
        var options = {
            algorithm: "binary-tree",
            padding: groupConfig.jpeg ? 4 : 1,
            engine: "gmsmith",
            src: _.pluck(scaledSprites, "path")
        };

        return imageProcessor.spritesmith(options, cachedImagePath, groupConfig.jpeg, groupConfig.quality)
        .then(function (spritesmithResult) {
            if (config.max_pixels_per_sprite_sheet.hard < spritesmithResult.properties.width * spritesmithResult.properties.height) {
                throw new Error("Spritesheet " + name + "(" + _.pluck(scaledSprites, "path") + ") has breached the hard limit of max_pixels_per_sprite_sheet");
            }
            return spritesmithResult;
        });
    }

    function createLoadingInformation(cachedImagePath, spritesmithResult) {
        return _.map(spritesmithResult.coordinates, function(data, filename) {
            var spriteHash = path.basename(filename).split("_")[2];
            var sprite = _.findWhere(_.pluck(scaledSprites, "sprite"), {hash: spriteHash});
            var scaledSprite = sprite.scaledSprites[scaledSprites[0].scaleName];
            var result = {
                "name": sprite.name,
                "frame": {
                    "x": data.x,
                    "y": data.y,
                    "w": scaledSprite.width,
                    "h": scaledSprite.height
                },
                "rotated": false,
                "trimmed": false,
                "spriteSourceSize": {
                    "x": 0,
                    "y": 0,
                    "w": data.width,
                    "h": data.height
                },
                "sourceSize": {
                    "w": data.width,
                    "h": data.height
                },
                "source": {
                    "w": spritesmithResult.properties.width,
                    "h": spritesmithResult.properties.height,
                    "image": that.basename
                }
            };

            if (scaledSprite.trim) {
                result.trimmed = true;
                result.spriteSourceSize.x = scaledSprite.trim.x;
                result.spriteSourceSize.y = scaledSprite.trim.y;
                result.sourceSize.w = scaledSprite.trim.width;
                result.sourceSize.h = scaledSprite.trim.height;
            }

            return result;
        });
    }

    function cacheMiss() {
        var cachedImagePath = cachePath + "/" + that.basename;
        return createImage(cachedImagePath)
        .then(function(result) {
            return createLoadingInformation(cachedImagePath, result);
        })
        .then(function(loadingInformation) {
            return {
                cachedImagePath: cachedImagePath,
                loadingInformation: loadingInformation,
                outputFilesize: fs.statSync(cachedImagePath).size
            };
        });
    }

    function cacheInterpret(data) {
        that.cachedImagePath = data.cachedImagePath;
        that.loadingInformation = data.loadingInformation;
        that.outputFilesize = data.outputFilesize;
    }

    that.process = function() {
        return cache.lookup("spritesheet", name, cacheMiss)
        .then(cacheInterpret)
        .then(function() { return that; });
    };

    that.copy = function(outputPath) {
        return copyFiles(outputPath);
    };
};
