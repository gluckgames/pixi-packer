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

describe("ImageProcessor", () => {
    let imageProcessor, tempPath, mockTransformer, bytesTransformed;

    beforeEach(() => {
        imageProcessor = new ImageProcessor({"use_image_magick": true});

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
    });

    context("#saveImageAsJpeg", () => {
        let inputBuffer, outputPath;

        beforeEach(() => {
            outputPath = path.join(tempPath, "compressed.jpeg");
            let inputPath = path.join(__dirname, "../resources/crop.png");
            inputBuffer = fs.readFileSync(inputPath);
        });

        it("compression 'null'", () => {
            return imageProcessor.saveImageAsJpeg(inputBuffer, outputPath, 70, null)
            .then(() =>{
                expect(fs.statSync(outputPath).size).to.be.greaterThan(0);
            });
        });

        it("use custom compressor", () => {
            return imageProcessor.saveImageAsJpeg(inputBuffer, outputPath, 0, mockTransformer)
            .then(() => {
                expect(fs.statSync(outputPath).size).to.equal(bytesTransformed);
            });
        });

    });

    context("#saveImageAsPng", () => {
        let inputBuffer, outputPath, inputSize;

        beforeEach(() => {
            outputPath = path.join(tempPath, "compressed.png");
            let inputPath = path.join(__dirname, "../resources/crop.png");
            inputBuffer = fs.readFileSync(inputPath);
            inputSize = fs.statSync(inputPath).size;
        });

        it("compression 'null'", () => {
            return imageProcessor.saveImageAsPng(inputBuffer, outputPath, 0, null)
            .then(() => {
                assert.equal(fs.statSync(outputPath).size, inputSize);
            });
        });

        it("use custom compressor", () => {
            return imageProcessor.saveImageAsPng(inputBuffer, outputPath, 0, mockTransformer)
            .then(() => {
                assert.equal(fs.statSync(outputPath).size, inputSize);
                assert.equal(bytesTransformed, inputSize);
            });
        });
    });
});
