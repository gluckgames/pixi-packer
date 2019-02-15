"use strict";

var fs = require("graceful-fs");
let promisify = require("es6-promisify");
var crypto = require("crypto");
var _ = require("underscore");
var ScaledSprite = require("./scaled_sprite");
var path = require("path");

module.exports = class Sprite {
    constructor(root, spritePath, groupConfig, config, cache, cachePath, imageProcessor) {
        this.root = root;
        this.spritePath = spritePath;
        this.groupConfig = groupConfig;
        this.config = config;
        this.cache = cache;
        this.cachePath = cachePath;
        this.imageProcessor = imageProcessor;
        this.name = path.parse(spritePath).name;
        this.path = spritePath;
    }

    calculateSize() {
        return this.imageProcessor.getSize(this.path);
    }

    createAndProcessScaledVersions(queue) {
        this.scaledSprites = _.mapObject(this.config.scales, (scale, scaleName) => {
            return new ScaledSprite(this, scale, scaleName, this.config, this.cache, this.cachePath, this.imageProcessor, this.groupConfig);
        });
        return Promise.all(_.map(this.scaledSprites, scaledSprite => {
            return queue.add(() => scaledSprite.process());
        }));
    }

    calculateHash() {
        return promisify(fs.stat)(this.path)
        .then(stat => {
            // stat.mtime.getTime() is not in here because it causes problems with git
            let identifier = this.path + " " + stat.size;
            this.hash = crypto.createHash("sha1").update(identifier).digest("hex");
        });
    }

    cacheMiss() {
        return this.calculateSize()
        .then(size => {
            return {
                name: this.name,
                width: size.width,
                height: size.height
            };
        });
    }

    cacheInterpret(data) {
        this.width = data.width;
        this.height = data.height;
    }

    process(queue) {
        return this.calculateHash()
        .then(() => this.cache.lookup("sprite", this.hash, this.cacheMiss.bind(this)))
        .then(this.cacheInterpret.bind(this))
        .then(() => this.createAndProcessScaledVersions(queue))
        .then(() => this);
    };
};
