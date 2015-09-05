"use strict";


var fs = require("fs");
var crypto = require("crypto");
var Q = require("q");
var _ = require("underscore");
var ScaledSprite = require("./scaled_sprite");
var path = require("path");

module.exports = function Sprite(root, spritePath, groupConfig, config, cache, cachePath, imageProcessor) {
    var that = this;
    that.name = path.parse(spritePath).name;
    that.path = spritePath;

    function calculateSize() {
        return imageProcessor.getSize(that.path);
    }

    function createAndProcessScaledVersions() {
        that.scaledSprites = _.mapObject(config.scales, function(scale, scaleName) {
            return new ScaledSprite(that, scale, scaleName, config, cache, cachePath, imageProcessor);
        });
        return Q.all(_.map(that.scaledSprites, function(scaledSprite) {
            return scaledSprite.process();
        }));
    }

    function calculateHash() {
        return Q.nfcall(fs.stat, that.path)
        .then(function(stat) {
            var identifier = that.path + " " + stat.size + " " + stat.mtime.getTime();
            that.hash = crypto.createHash("sha1").update(identifier).digest("hex");
        });
    }

    function cacheMiss() {
        return calculateSize()
        .then(function(size) {
            return {
                name: that.name,
                width: size.width,
                height: size.height
            };
        });
    }

    function cacheInterpret(data) {
        that.width = data.width;
        that.height = data.height;
    }

    that.process = function() {
        return calculateHash()
        .then(function() {
            return cache.lookup("sprite", that.hash, cacheMiss);
        })
        .then(cacheInterpret)
        .then(createAndProcessScaledVersions)
        .then(function() { return that; });
    };
};
