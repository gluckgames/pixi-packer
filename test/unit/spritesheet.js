"use strict";

var Spritesheet = require("../../lib/spritesheet");
var assert = require("chai").assert;

describe("Spritesheet", function () {
    var spritesheet, bin, groupConfig, config, cache, cachePath, imageProcessor, scaledGroup;

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
        scaledGroup = { groupHash: "abcd" };
        spritesheet = new Spritesheet(scaledGroup, bin, groupConfig, config, cache, cachePath, imageProcessor);
    });

    context("#calculateHash", () => {
        it("stays the same if no change is made", function() {
            let otherSpritesheet = new Spritesheet(scaledGroup, bin, groupConfig, config, cache, cachePath, imageProcessor);
            assert.equal(spritesheet.hash, otherSpritesheet.hash);
        });

        it("changes when path of a rect changes", function() {
            bin.rects[0].data.path = "/one/sprite/changed";
            let otherSpritesheet = new Spritesheet(scaledGroup, bin, groupConfig, config, cache, cachePath, imageProcessor);
            assert.notEqual(spritesheet.hash, otherSpritesheet.hash);
        });

        it("changes when scaledSprites is added", function() {
            bin.rects.push({data: {path: "foo/bar"}})
            let otherSpritesheet = new Spritesheet(scaledGroup, bin, groupConfig, config, cache, cachePath, imageProcessor);
            assert.notEqual(spritesheet.hash, otherSpritesheet.hash);
        });

        it("changes when extension changes", function() {
            groupConfig.jpeg = false;
            let otherSpritesheet = new Spritesheet(scaledGroup, bin, groupConfig, config, cache, cachePath, imageProcessor);
            assert.notEqual(spritesheet.hash, otherSpritesheet.hash);
        });

        it("changes when quality changes", function() {
            groupConfig.quality = 75;
            let otherSpritesheet = new Spritesheet(scaledGroup, bin, groupConfig, config, cache, cachePath, imageProcessor);
            assert.notEqual(spritesheet.hash, otherSpritesheet.hash);
        });
    });

    it("has the correct basename", function() {
        assert.equal(spritesheet.basename, "1eca9bde9b9a851b574a7d1983576d90f118f3d2.jpeg");
    });
});
