"use strict";

var crypto = require("crypto");
var fs = require("fs-extra");
var Q = require("q");
var _ = require("underscore");
var path = require("path");

module.exports = function Spritesheet(name, scaledSprites, groupConfig, config, cache, cachePath, imageProcessor) {
    var that = this;

    function getExtension() {
        return groupConfig.jpeg ? "jpeg" : "png";
    }

    function copyFiles(outputPath) {
        var outputImagePath = outputPath + "/" + name + "." + getExtension();
        return Q.nfcall(fs.copy, that.cachedImagePath, outputImagePath);
    }

    function createImage(cachedImagePath) {
        var options = {
            algorithm: "binary-tree",
            padding: groupConfig.jpeg ? 4 : 1,
            engine: "gmsmith",
            src: _.pluck(scaledSprites, "path")
        };

        return imageProcessor.spritesmith(options, cachedImagePath, groupConfig.jpeg, groupConfig.quality, groupConfig.compression)
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

    function cacheMiss() {
        var cachedImagePath = cachePath + "/" + that.getBasename();
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

    that.getBasename = function () {
        return name + "." + getExtension();
    };

    that.calculateHash = function () {
        var hash = crypto.createHash("sha1");
        hash.update(_.pluck(scaledSprites, "path").sort().join(" ") + "_");
        hash.update(getExtension() + "_");
        hash.update((groupConfig.quality ? groupConfig.quality : "noquality") + "_");
        hash.update((groupConfig.compression ? groupConfig.compression : "nocompression"));
        return name + "_" + hash.digest("hex");
    };

    that.process = function() {
        var hash = that.calculateHash();
        return cache.lookup("spritesheet", hash, cacheMiss, 3)
        .then(cacheInterpret)
        .then(function() { return that; });
    };

    that.copy = function(outputPath) {
        return copyFiles(outputPath);
    };
};
