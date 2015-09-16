"use strict";

var ImageProcessor = require("../../lib/image_processor");
var path = require("path");
var assert = require("chai").assert;
var mkdirp = require("mkdirp");
var Q = require("q");
var rimraf = require("rimraf");
var imageSize = require("image-size");
var fs = require("fs");

describe("ImageProcessor", function () {
    var imageProcessor, tempPath;

    beforeEach(function() {
        imageProcessor = new ImageProcessor({"use_image_magick": true});

        tempPath = path.join(__dirname, "../tmp");
        return Q.nfcall(rimraf, tempPath)
        .then(function() {
            return Q.nfcall(mkdirp, tempPath);
        });
    });

    afterEach(function() {
        return Q.nfcall(rimraf, tempPath);
    });

    context("#trim", function() {
        var outputPath;

        beforeEach(function() {
            outputPath = path.join(tempPath, "crop_out.png");
        });

        it("works correctly on an image with transparency", function() {
            var inputPath = path.join(__dirname, "../resources/crop.png");
            return imageProcessor.trim(inputPath, outputPath)
            .then(function(data) {
                return Q.nfcall(imageSize, outputPath)
                .then(function(size) {
                    assert.equal(data.width, 159);
                    assert.equal(data.height, 150);
                    assert.equal(data.width, size.width);
                    assert.equal(data.height, size.height);
                });
            });
        });

        it("works correctly on an image without transparency", function() {
            var inputPath = path.join(__dirname, "../resources/crop_full_colour.png");
            return imageProcessor.trim(inputPath, outputPath)
            .then(function(data) {
                return Q.nfcall(imageSize, outputPath)
                .then(function(size) {
                    assert.equal(data.width, 300);
                    assert.equal(data.height, 300);
                    assert.equal(data.width, size.width);
                    assert.equal(data.height, size.height);
                });
            });
        });
    });

    context("#saveImageAsPng", function() {
        var input, outputPath, inputSize;

        beforeEach(function() {
            outputPath = path.join(tempPath, "compressed.png");
            var inputPath = path.join(__dirname, "../resources/crop.png");
            input = fs.readFileSync(inputPath, {encoding: "binary"});
            inputSize = input.length;
        });

        it("compression 'none'", function() {
            return imageProcessor.saveImageAsPng(input, outputPath, 0, "none")
            .then(function() {
                assert.equal(fs.statSync(outputPath).size, inputSize);
            });
        });

        it("compression 'pngquant'", function() {
            return imageProcessor.saveImageAsPng(input, outputPath, 0, "pngquant")
            .then(function() {
                assert.ok(fs.statSync(outputPath).size < inputSize);
            });
        });

        it("compression 'optipng'", function() {
            return imageProcessor.saveImageAsPng(input, outputPath, 0, "optipng")
            .then(function() {
                assert.ok(fs.statSync(outputPath).size < inputSize);
            });
        });
    });
});
