"use strict";

var gm = require("gm");
var Spritesmith = require("spritesmith");
var os = require("os");
var fs = require("fs");
var promisify = require("es6-promisify");
var imageSize = promisify(require("image-size"));
let promiseLimit = require("promise-limit");

module.exports = class ImageProcessor{
    constructor(config) {
        var concurrencyLimit = config.image_processing_concurrency_limit;
        if (concurrencyLimit === undefined) {
            concurrencyLimit = Math.max(os.cpus().length - 1, 1);
        }

        if (process.env.IMAGE_PROCESSING_CONCURRENCY) {
            concurrencyLimit = parseInt(process.env.IMAGE_PROCESSING_CONCURRENCY, 10);
        }

        this.limit = promiseLimit(concurrencyLimit);
        this.gm = gm.subClass({ imageMagick: true });
    }

    getSize(path) {
        return this.limit(() => imageSize(path));
    }

    scale(input, output, scale) {
        return this.limit(() => {
            let resized = this.gm(input)
            .resizeExact(scale.width, scale.height);
            return promisify(resized.write.bind(resized))(output);
        });
    }

    trim(input, output, fuzz) {
        fuzz = fuzz || "0%";

        return this.limit(() => {
            let imageWithBorder = this.gm(input)
            .borderColor("none")
            .border(1, 1);

            return promisify(imageWithBorder.toBuffer.bind(imageWithBorder))()
            .then((data) => {
                let image = this.gm(data).trim();
                return promisify(image.identify.bind(image))("%@");
            })
            .then((data) => {
                data = data.match(/^(\d+)x(\d+)\+(\d+)\+(\d+)$/);
                var width = parseInt(data[1], 10);
                var height = parseInt(data[2], 10);
                var x = parseInt(data[3], 10) - 1;
                var y = parseInt(data[4], 10) - 1;

                if (width === 0 || height === 0) {
                    // precaution: never use 0x0 images
                    width = 1;
                    height = 1;
                    x = 0;
                    y = 0;
                }

                var crop = this.gm(input)
                    .crop(width, height, x, y);
                return promisify(crop.write.bind(crop))(output)
                .then(() => { return {width, height, x, y}; });
            });
        });
    };

    saveWithCompressor(imageBuffer, outputFileName, compressor) {
        return Promise.resolve(imageBuffer)
        .then(buffer => compressor ? compressor(buffer) : buffer)
        .then(buffer => promisify(fs.writeFile)(outputFileName, buffer));
    }

    saveImageAsJpeg(imageBuffer, outputFileName, quality, compressor) {
        var image = this.gm(imageBuffer, "input.png")
        .compress("jpeg")
        .quality(quality || 90);

        return promisify(image.toBuffer.bind(image))("jpeg")
        .then(buffer => this.saveWithCompressor(buffer, outputFileName, compressor));
    };

    saveImageAsPng(imageBuffer, outputFileName, quality, compressor) {
        return this.saveWithCompressor(imageBuffer, outputFileName, compressor);
    };

    spritesmith(options, src, path, jpeg, quality, compressor) {
        var saveImage = jpeg ?
            this.saveImageAsJpeg.bind(this) :
            this.saveImageAsPng.bind(this);
        return this.limit(() => promisify(Spritesmith.run)({src}))
        .then(result => {
            return saveImage(result.image, path, quality, compressor)
           .then(() => {
                delete result.image;
                return result;
            });
        });
    }
};
