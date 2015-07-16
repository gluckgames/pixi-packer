"use strict";

module.exports = function ScaledSprite(sprite, scale, scaleName, config, cache, cachePath, imageProcessor) {
    var that = this;
    that.sprite = sprite;
    that.scaleName = scaleName;

    function cacheMiss() {
        var width = Math.round(sprite.width * scale);
        var height = Math.round(sprite.height * scale);
        var path = cachePath + "/scaled_sprite_" + sprite.hash + "_" + scaleName + ".png";

        return imageProcessor.scale(sprite.path, path, {width: width, height: height})
        .then(function() {
            return {
                width: width,
                height: height,
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
        that.path = data.path;
    }

    that.process = function() {
        var key = sprite.hash + "_" + scaleName;
        return cache.lookup("scaledSprite", key, cacheMiss)
        .then(cacheInterpret)
        .then(function() { return that; });
    };
};
