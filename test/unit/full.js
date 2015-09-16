"use strict";

var PixiPacker = require("../../index");
var path = require("path");
var assert = require("chai").assert;
var mkdirp = require("mkdirp");
var Q = require("q");
var rimraf = require("rimraf");
var fs = require("fs");

describe("Full run", function () {
    var pixiPacker, config, tempPath, outputPath;

    before(function() {
        this.timeout(60000);

        tempPath = path.join(__dirname, "../tmp");
        outputPath = path.join(__dirname, "../output");
        return Q.nfcall(rimraf, tempPath)
        .then(function() {
            return Q.nfcall(rimraf, outputPath);
        })
        .then(function() {
            return Q.nfcall(mkdirp, tempPath);
        })
        .then(function() {
            config = require("../../example.js");

            pixiPacker = new PixiPacker(
                config,
                path.resolve(__dirname, ".."),
                path.resolve(__dirname, outputPath),
                path.resolve(__dirname, tempPath)
            );

            return pixiPacker.process();
        });
    });

    after(function() {
        return Q.nfcall(rimraf, outputPath)
        .then(function() {
            return Q.nfcall(rimraf, tempPath);
        });
    });

    it("creates an output directory", function() {
        assert.ok(fs.lstatSync(outputPath).isDirectory());
    });

    it("creates an manifests", function() {
        assert.ok(fs.lstatSync(outputPath + "/game_EN_web.json").isFile());
        assert.ok(fs.lstatSync(outputPath + "/game_DE_web.json").isFile());
        assert.ok(fs.lstatSync(outputPath + "/game_EN_web_retina.json").isFile());
        assert.ok(fs.lstatSync(outputPath + "/game_DE_web_retina.json").isFile());
        assert.ok(fs.lstatSync(outputPath + "/menu_EN_web.json").isFile());
        assert.ok(fs.lstatSync(outputPath + "/menu_DE_web.json").isFile());
        assert.ok(fs.lstatSync(outputPath + "/menu_EN_web_retina.json").isFile());
        assert.ok(fs.lstatSync(outputPath + "/menu_DE_web_retina.json").isFile());
    });

    it("has the right resolution", function() {
        var manifest = require(outputPath + "/game_DE_web_retina.json");
        assert.equal(manifest.resolution, 2);
    });

    it("creates all images", function() {
        var manifest = require(outputPath + "/game_DE_web_retina.json");
        manifest.spritesheets.forEach(function(spritesheet) {
            assert.ok(fs.lstatSync(outputPath + "/" + spritesheet.image).isFile());
        });
    });
});
