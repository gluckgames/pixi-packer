"use strict";

var fs = require("fs-extra");
var spritesmith = require("spritesmith");
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

    function saveImageAsJpeg(image, cachedImagePath) {
        // ToDo: Avoid temporary png file
        var filenamePng = cachedImagePath + ".png";
        return Q.nfcall(fs.writeFile, filenamePng, image, "binary")
        .then(function() {
            return imageProcessor.convertToJpeg(filenamePng, cachedImagePath, groupConfig.quality);
        })
        .then(function() {
            return Q.nfcall(fs.unlink, filenamePng);
        });
    }

    function saveImageAsPng(image, cachedImagePath) {
       return Q.nfcall(fs.writeFile, cachedImagePath, image, "binary")
        .then(function() {
            return imageProcessor.optimisePng(cachedImagePath, groupConfig.quality);
        });
    }

    function createImage(cachedImagePath) {
        var options = {
            algorithm: "binary-tree",
            padding: groupConfig.jpeg ? 4 : 1,
            engine: "gmsmith",
            src: _.pluck(scaledSprites, "path")
        };

        var saveImage = groupConfig.jpeg ? saveImageAsJpeg : saveImageAsPng;

        return Q.nfcall(spritesmith, options)
        .then(function (spritesmithResult) {
            return saveImage(spritesmithResult.image, cachedImagePath)
            .then(function() {
                delete spritesmithResult.image;
                return spritesmithResult;
            });
        });
    }

    function createLoadingInformation(cachedImagePath, spritesmithResult) {
        return _.map(spritesmithResult.coordinates, function(data, filename) {
            var spriteHash = path.basename(filename).split("_")[2];
            var sprite = _.findWhere(_.pluck(scaledSprites, "sprite"), {hash: spriteHash});
            return {
                "name": sprite.name,
                "frame": {
                    "x": data.x,
                    "y": data.y,
                    "w": data.width,
                    "h": data.height
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
