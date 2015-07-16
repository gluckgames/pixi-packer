"use strict";

var qlimit = require("qlimit");
var Q = require("q");
var gm = require("gm");
var Imagemin = require("imagemin");
var imageminPngquant = require("imagemin-pngquant");
var imageSize = require("image-size");

module.exports = function ImageProcessor(config) {
    var that = this;

    var concurrencyLimit = config.image_processing_concurrency_imit;
    if (concurrencyLimit === undefined) {
        concurrencyLimit = 2;
    }
    var limit = qlimit(concurrencyLimit);

    var internalGm = gm;
    if (config.use_image_magick) {
        internalGm = gm.subClass({ imageMagick: true });
    }

    that.getSize = function(path) {
        return limit(function() {
            return Q.nfcall(imageSize, path);
        })();
    };

    that.convertToJpeg = function (input, output, quality) {
        quality = quality || 90;
        var converted = internalGm(input)
        .compress("JPEG")
        .quality(quality);
        return limit(function() {
            return Q.ninvoke(converted, "write", output);
        })();
    };

    that.optimisePng = function(input, quality) {
        var pngquantConfig = config.pngquant || {quality: "65-80", speed: 4};
        if (quality) {
            pngquantConfig.quality = quality;
        }
        var im = new Imagemin()
            .src(input)
            .use(imageminPngquant(pngquantConfig));
        return limit(function() {
            return Q.ninvoke(im, "run");
        })();
    };

    that.scale = function (input, output, scale) {
        var resized = internalGm(input)
        .resize(scale.width, scale.height);
        return limit(function() {
            return Q.ninvoke(resized, "write", output);
        })();
    };
};
