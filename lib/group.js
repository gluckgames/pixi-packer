"use strict";

var crypto = require("crypto");
var glob = require("glob");
var Q = require("q");
var _ = require("underscore");
var Sprite = require("./sprite");
var ScaledGroup = require("./scaled_group");

module.exports = function Group(inputPath, groupConfig, config, cache, cachePath, imageProcessor, log) {
    var that = this;

    that.loadingStage = groupConfig.loading_stage;
    that.id = groupConfig.id;
    that.jpeg = groupConfig.jpeg;
    that.variation = groupConfig.variation;
    that.quality = groupConfig.quality;
    that.compression = groupConfig.compression;

    function createAndProcessSprites() {
        return Q.all(groupConfig.sprites.map(function(pattern) {
            var fullPattern = inputPath + "/" + pattern;
            return Q.nfcall(glob, fullPattern)
            .then(function(paths) {
                if (paths.length === 0) {
                    log.warn("Group %s, Pattern %s yields no files", groupConfig.id, fullPattern);
                }
                return paths;
            });
        }))
        .then(function(paths) {
            paths = _.flatten(paths);
            return Q.all(paths.map(function(path) {
                var sprite = new Sprite(inputPath, path, groupConfig, config, cache, cachePath, imageProcessor);
                return sprite.process();
            }));
        });
    }

    function calculateHash(sprites) {
        var hash = crypto.createHash("sha1");
        hash.update(_.pluck(sprites, "hash").sort().join(" "));
        hash.update(that.id || "");
        hash.update(that.variation || "");
        hash.update(that.jpeg ? "y" : "n");
        hash.update(that.quality ? that.quality + "" : "");
        hash.update(that.compression ? that.compression + "" : "");
        hash.update(that.loading_stage || "");
        return hash.digest("hex");
    }

    function createAndProcessScaledGroups(sprites) {
        that.scaledGroups = _.map(config.scales, function(scale, scaleName) {
            var scaledSprites = sprites.map(function(sprite) {
                return sprite.scaledSprites[scaleName];
            });
            return new ScaledGroup(scaledSprites, that.hash, scaleName, groupConfig, config, cache, cachePath, imageProcessor);
        });
        return Q.all(_.invoke(that.scaledGroups, "process"));
    }

    that.getScaledGroup = function(scaleName) {
        return _.findWhere(that.scaledGroups, {scaleName: scaleName});
    };

    that.process = function() {
        return createAndProcessSprites()
        .then(function(sprites) {
            that.sprites = sprites;
            that.hash = calculateHash(sprites);
            return createAndProcessScaledGroups(sprites);
        })
        .then(function() {
            log.info("Group %s", groupConfig.id);
            log.info("  %d sprites", that.sprites.length);
            _.each(that.scaledGroups, function(scaledGroup) {
                log.info("  %s: %d spritesheets, %sMB total",
                    scaledGroup.scaleName,
                    scaledGroup.spritesheets.length,
                    (scaledGroup.getOutputFilesize() / 1e+6).toFixed(2));
            });
            log.info("");

            return that;
        });
    };

    that.copy = function(outputPath) {
        return Q.all(_.invoke(that.scaledGroups, "copy", outputPath));
    };
};
