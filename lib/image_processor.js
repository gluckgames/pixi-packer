"use strict";

var qlimit = require("qlimit");
var Q = require("q");
var gm = require("gm");
var imageSize = require("image-size");
var spritesmith = require("spritesmith");
var os = require("os");
var fs = require("fs");
var execFile = require("child_process").execFile;

var DEFAULT_PNG_COMPRESSION = "pngquant";

module.exports = function ImageProcessor(config) {
    var that = this;

    var concurrencyLimit = config.image_processing_concurrency_imit;
    if (concurrencyLimit === undefined) {
        concurrencyLimit = Math.max(os.cpus().length - 1, 1);
    }

    if (process.env.IMAGE_PROCESSING_CONCURRENCY) {
        concurrencyLimit = parseInt(process.env.IMAGE_PROCESSING_CONCURRENCY, 10);
    }

    var limit = qlimit(concurrencyLimit);

    var internalGm = gm;
    if (config.use_image_magick) {
        internalGm = gm.subClass({ imageMagick: true });
    }

    that.getSize = limit(function(path) {
        return Q.nfcall(imageSize, path);
    });

    that.scale = limit(function (input, output, scale) {
        var resized = internalGm(input)
        .resize(scale.width, scale.height);
        return Q.ninvoke(resized, "write", output);
    });

    that.trim = limit(function(input, output, fuzz) {
        fuzz = fuzz || "0%";
        var withBorder = internalGm(input)
        .borderColor("none")
        .border(1, 1);
        return Q.ninvoke(withBorder, "toBuffer")
        .then(function(data) {
            return Q.ninvoke(internalGm(data).trim(), "identify", "%@");
        })
        .then(function(data) {
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

            var crop = internalGm(input)
                .crop(width, height, x, y);
            return Q.ninvoke(crop, "write", output)
            .then(function() {
                return {width: width, height: height, x: x, y: y};
            });
        });
    });

    that.saveImageAsJpeg = function(image, cachedImagePath, quality) {
        // ToDo: Avoid temporary png file
        quality = quality || 90;
        var filenamePng = cachedImagePath + ".png";
        return Q.nfcall(fs.writeFile, filenamePng, image, "binary")
        .then(function() {
            var converted = internalGm(filenamePng)
            .compress("JPEG")
            .quality(quality);
            return Q.ninvoke(converted, "write", cachedImagePath);
        })
        .then(function() {
            return Q.nfcall(fs.unlink, filenamePng);
        });
    };

    // ToDo: Quality is ignored atm. Add it.
    that.saveImageAsPng = function(image, cachedImagePath, quality, compression) {
        compression = compression || DEFAULT_PNG_COMPRESSION;

        return Q.nfcall(fs.writeFile, cachedImagePath, new Buffer(image, "binary"))
        .then(function() {
            if (compression === "none") {
                return Q.resolve();
            } else if (compression === "optipng") {
                return Q.nfcall(execFile, require("optipng-bin"), ["-out", cachedImagePath, cachedImagePath]);
            } else if (compression === "pngquant") {
                return Q.nfcall(execFile, require("pngquant-bin"), ["-o", cachedImagePath, cachedImagePath, "-f"]);
            } else {
                throw new Error("Compression '" + compression + "' is not supported");
            }
        });
    };

    that.spritesmith = limit(function(options, path, jpeg, quality, compression) {
        var saveImage = jpeg ? that.saveImageAsJpeg : that.saveImageAsPng;
        return Q.nfcall(spritesmith, options)
        .then(function(result) {
            return saveImage(result.image, path, quality, compression)
            .then(function() {
                delete result.image;
                return result;
            });
        });
    });
};
