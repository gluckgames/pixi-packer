"use strict";

module.exports = function ScaledSprite(sprite, scale, scaleName, config, cache, cachePath, imageProcessor, groupConfig) {
    var that = this;
    that.sprite = sprite;
    that.scaleName = scaleName;

    function cacheMiss() {
        var width = Math.round(sprite.width * scale.scale);
        var height = Math.round(sprite.height * scale.scale);
        var path = cachePath + "/scaled_sprite_" + sprite.hash + "_" + scaleName + ".png";

        return imageProcessor.scale(sprite.path, path, {width: width, height: height})
        .then(function() {
            var groupConfigTrim = typeof(groupConfig.trim) === "boolean" ? groupConfig.trim : true;
            if (config.trim && groupConfigTrim) {
                return imageProcessor.trim(path, path);
            } else {
                return {x: 0, y: 0, height: height, width: width};
            }
        })
        .then(function(trimData) {
            if (trimData.x === 0 && trimData.y === 0 && trimData.width === width && trimData.height === height) {
                return {
                    width: width,
                    height: height,
                    trim: null,
                    path: path
                };
            }

            return {
                width: width,
                height: height,
                trim: trimData,
                path: path
            };
        });
    }

    that.getPixelCount = function () {
        return that.width * that.height;
    };

    function cacheInterpret(data) {
        that.width = data.width;
        that.height = data.height;
        that.trim = data.trim;
        that.path = data.path;
    }

    that.process = function() {
        var key = sprite.hash + "_" + scaleName + (config.trim ? "_trim" : "_notrim");
        return cache.lookup("scaledSprite", key, cacheMiss)
        .then(cacheInterpret)
        .then(function() { return that; });
    };
};
