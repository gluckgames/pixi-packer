"use strict";

var Spritesheet = require("../../lib/spritesheet");
var assert = require("chai").assert;

describe("Spritesheet", function () {
    var spritesheet, scaledSprites, groupConfig, config, cache, cachePath, imageProcessor;

    beforeEach(function() {
        scaledSprites = [
            {"path": "/one/sprite"},
            {"path": "/another/sprite"}
        ];
        groupConfig = {
            jpeg: true,
            quality: 90,
            compression: "pngquant"
        };
        config = {};
        cache = {};
        cachePath = "/some/path";
        imageProcessor = {};
        spritesheet = new Spritesheet("test-spritesheet", scaledSprites, groupConfig, config, cache, cachePath, imageProcessor);
    });

    context("#calculateHash", function() {
        var originalHash;
        beforeEach(function() {
            originalHash = spritesheet.calculateHash();
        });

        it("stays the same if no change is made", function() {
            var otherSpritesheet = new Spritesheet("test-spritesheet", scaledSprites, groupConfig, config, cache, cachePath, imageProcessor);
            assert.equal(originalHash, otherSpritesheet.calculateHash());
        });

        it("changes when scaledSprites changes", function() {
            scaledSprites[0].path = "/one/sprite/changed";
            assert.notEqual(originalHash, spritesheet.calculateHash());
        });

        it("changes when scaledSprites is added", function() {
            scaledSprites.push({"path": "/yet/another/one"});
            assert.notEqual(originalHash, spritesheet.calculateHash());
        });

        it("changes when extension changes", function() {
            groupConfig.jpeg = false;
            assert.notEqual(originalHash, spritesheet.calculateHash());
        });

        it("changes when quality changes", function() {
            groupConfig.quality = 75;
            assert.notEqual(originalHash, spritesheet.calculateHash());
        });

        it("changes when compression changes", function() {
            groupConfig.compression = "optipng";
            assert.notEqual(originalHash, spritesheet.calculateHash());
        });
    });

    it("has the correct basename", function() {
        assert.equal(spritesheet.getBasename(), "test-spritesheet.jpeg");
    });
});
