"use strict";

let ImageProcessor = require("../../lib/image_processor");
let path = require("path");
let assert = require("chai").assert;
let expect = require("chai").expect;
let promisify = require("es6-promisify");
let mkdirp = promisify(require("mkdirp"));
let rimraf = promisify(require("rimraf"));
let imageSize = promisify(require("image-size"));
let fs = require("fs");
let imageType = require("image-type");

describe("ImageProcessor", () => {
    let imageProcessor, tempPath, mockTransformer, bytesTransformed;

    beforeEach(() => {
        imageProcessor = new ImageProcessor({});

        bytesTransformed = 0;
        mockTransformer = (buf) => {
            bytesTransformed = buf.length;
            return buf.slice();
        };

        tempPath = path.join(__dirname, "../tmp");
        return rimraf(tempPath)
        .then(() => mkdirp(tempPath));
    });

    afterEach(() => {
        return rimraf(tempPath);
    });

    context("#trim", () => {
        let outputPath;

        beforeEach(() => {
            outputPath = path.join(tempPath, "crop_out.png");
        });

        it("works correctly on an image with transparency", () => {
            let inputPath = path.join(__dirname, "../resources/crop.png");
            return imageProcessor.trim(inputPath, outputPath)
            .then((data) => {
                return imageSize(outputPath)
                .then((size) => {
                    assert.equal(data.width, 159);
                    assert.equal(data.height, 150);
                    assert.equal(data.width, size.width);
                    assert.equal(data.height, size.height);
                });
            });
        });

        it("works correctly on an image without transparency", () => {
            let inputPath = path.join(__dirname, "../resources/crop_full_colour.png");
            return imageProcessor.trim(inputPath, outputPath)
            .then((data) => {
                return imageSize(outputPath)
                .then((size) => {
                    assert.equal(data.width, 300);
                    assert.equal(data.height, 300);
                    assert.equal(data.width, size.width);
                    assert.equal(data.height, size.height);
                });
            });
        });
    })

    context("#scale", () => {
        it("works correctly on images with extreme ratios", () => {
            let outputPath = path.join(tempPath, "scale_out.png");
            let inputPath = path.join(__dirname, "../resources/extreme_ratio.png");
            return imageProcessor.scale(inputPath, outputPath, {width: 4, height: 792})
            .then(() => imageSize(outputPath))
            .then((size) => {
                assert.equal(size.width, 4);
                assert.equal(size.height, 792);
            });
        });
    });

    context("#combine", () => {
        it("works correctly with png", () => {
            let outputPath = path.join(tempPath, "combine_out.png");
            let rects = [
                {x: 0, y: 0, data: { path: path.join(__dirname, "../resources/combine_1.png") }},
                {x: 102, y: 0, data: { path: path.join(__dirname, "../resources/combine_2.png") }},
                {x: 0, y: 172, data: { path: path.join(__dirname, "../resources/combine_3.png") }}
            ];

            return imageProcessor.combine(rects, 203, 343, outputPath, false, null, mockTransformer)
            .then(() => imageSize(outputPath))
            .then((size) => {
                assert.equal(size.width, 203);
                assert.equal(size.height, 343);
                assert.equal(bytesTransformed, fs.statSync(outputPath).size);
                assert.equal(imageType(fs.readFileSync(outputPath)).mime, "image/png");

                // ToDo: compare against 'combine_expected'
            });
        });

        it("works correctly with jpeg", () => {
            let outputPath = path.join(tempPath, "combine_out.png");
            let rects = [
                {x: 0, y: 0, data: { path: path.join(__dirname, "../resources/combine_1.png") }},
                {x: 102, y: 0, data: { path: path.join(__dirname, "../resources/combine_2.png") }},
                {x: 0, y: 172, data: { path: path.join(__dirname, "../resources/combine_3.png") }}
            ];

            return imageProcessor.combine(rects, 203, 343, outputPath, true, 90, mockTransformer)
            .then(() => imageSize(outputPath))
            .then((size) => {
                assert.equal(size.width, 203);
                assert.equal(size.height, 343);
                assert.equal(bytesTransformed, fs.statSync(outputPath).size);
                assert.equal(imageType(fs.readFileSync(outputPath)).mime, "image/jpeg");

                // ToDo: compare against 'combine_expected'
            });
        });
    });

});
