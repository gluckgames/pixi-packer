"use strict";

var Spritesheet = require("../../lib/spritesheet");
var assert = require("chai").assert;

describe("Spritesheet", function () {
    var spritesheet, bin, groupConfig, config, cache, cachePath, imageProcessor;

    beforeEach(function() {
        bin = {
            width: 1024,
            height: 1024,
            rects: [
                {data: {path: "/one/sprite"}},
                {data: {path: "/another/sprite"}}
            ]
        };
        groupConfig = {
            jpeg: true,
            quality: 90,
            compression: "pngquant"
        };
        config = {};
        cache = {};
        cachePath = "/some/path";
        imageProcessor = {};
        spritesheet = new Spritesheet("test-spritesheet", bin, groupConfig, config, cache, cachePath, imageProcessor);
    });

    context("#calculateHash", () => {
        let originalHash;
        beforeEach(() => {
            originalHash = spritesheet.calculateHash();
        });

        it("stays the same if no change is made", function() {
            let otherSpritesheet = new Spritesheet("test-spritesheet", bin, groupConfig, config, cache, cachePath, imageProcessor);
            assert.equal(originalHash, otherSpritesheet.calculateHash());
        });

        it("changes when path of a rect changes", function() {
            bin.rects[0].data.path = "/one/sprite/changed";
            assert.notEqual(originalHash, spritesheet.calculateHash());
        });

        it("changes when scaledSprites is added", function() {
            bin.rects.push({data: {path: "foo/bar"}})
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
    });

    it("has the correct basename", function() {
        assert.equal(spritesheet.getBasename(), "test-spritesheet.jpeg");
    });
});
