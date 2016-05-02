"use strict";

module.exports = class ScaledSprite{
    constructor (sprite, scale, scaleName, config, cache, cachePath, imageProcessor, groupConfig) {
        this.sprite = sprite;
        this.scale = scale;
        this.scaleName = scaleName;
        this.config = config;
        this.cache = cache;
        this.cachePath = cachePath;
        this.imageProcessor = imageProcessor;
        this.groupConfig = groupConfig;
    }

    cacheMiss() {
        var width = Math.round(this.sprite.width * this.scale.scale);
        var height = Math.round(this.sprite.height * this.scale.scale);
        var path = this.cachePath + "/scaled_sprite_" + this.sprite.hash + "_" + this.scaleName + ".png";

        return this.imageProcessor.scale(this.sprite.path, path, {width, height})
        .then(() => {
            let groupConfigTrim = (typeof this.groupConfig.trim === "boolean") ? this.groupConfig.trim : true;
            if (this.config.trim && groupConfigTrim) {
                return this.imageProcessor.trim(path, path);
            } else {
                return {x: 0, y: 0, height, width};
            }
        })
        .then(trim => {
            if (trim.x === 0 && trim.y === 0 && trim.width === width && trim.height === height) {
                trim = null;
            }

            return { width, height, trim, path };
        });
    }

    get pixelCount() {
        return this.width * this.height;
    };

    cacheInterpret(data) {
        this.width = data.width;
        this.height = data.height;
        this.trim = data.trim;
        this.path = data.path;
    }

    process() {
        let key = this.sprite.hash + "_" + this.scaleName + (this.config.trim ? "_trim" : "_notrim");
        return this.cache.lookup("scaledSprite", key, this.cacheMiss.bind(this))
        .then(this.cacheInterpret.bind(this))
        .then(() => this);
    };
};
