"use strict";

var qlimit = require("qlimit");
var Q = require("q");
var gm = require("gm");
var Imagemin = require("imagemin");
var imageminPngquant = require("imagemin-pngquant");
var imageSize = require("image-size");
var spritesmith = require("spritesmith");
var os = require("os");
var fs = require("fs");

module.exports = function ImageProcessor(config) {
    var that = this;

    var concurrencyLimit = config.image_processing_concurrency_imit;
    if (concurrencyLimit === undefined) {
        concurrencyLimit = Math.max(os.cpus().length - 1, 1);
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

            var crop = internalGm(input)
                .crop(width, height, x, y);
            return Q.ninvoke(crop, "write", output)
            .then(function() {
                return {width: width, height: height, x: x, y: y};
            });
        });
    });

    function saveImageAsJpeg(image, cachedImagePath, quality) {
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
    }

    function saveImageAsPng(image, cachedImagePath, quality) {

        var imageminConfig = config.imagemin_config || {quality: "65-80", speed: 4};
        if (quality) {
            imageminConfig.quality = quality;
        }

        var im = new Imagemin()
            .src(new Buffer(image, "binary"))
            .use(imageminPngquant(imageminConfig));
        return Q.ninvoke(im, "run")
        .then(function(files) {
            return Q.nfcall(fs.writeFile, cachedImagePath, files[0].contents);
        });
    }

    that.spritesmith = limit(function(options, path, jpeg, quality) {
        var saveImage = jpeg ? saveImageAsJpeg : saveImageAsPng;
        return Q.nfcall(spritesmith, options)
        .then(function(result) {
            return saveImage(result.image, path, quality)
            .then(function() {
                delete result.image;
                return result;
            });
        });
    });
};
