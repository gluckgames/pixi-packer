"use strict";

let gm = require("gm");
let os = require("os");
let fs = require("fs");
let promisify = require("es6-promisify");
let imageSize = promisify(require("image-size"));
let Gmsmith = require("gmsmith");
let concat = require("concat-stream");
let promiseLimit = require("promise-limit");

module.exports = class ImageProcessor{
    constructor(config) {
        let concurrencyLimit = config.image_processing_concurrency_limit;
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

    combine(rects, width, height, outputFileName, jpeg, quality, compressor) {
        let exportOptions = {format: jpeg ? "jpeg" : "png"};
        if (jpeg && quality) {
            exportOptions.quality = quality;
        }
        let gmsmith = new Gmsmith({});
        let paths = rects.map(rect => rect.data.path);

        return this.limit(() => {
            return promisify(gmsmith.createImages.bind(gmsmith))(paths)
            .then(images => {
                let canvas = gmsmith.createCanvas(width, height);

                images.forEach((image, i) => {
                    canvas.addImage(image, rects[i].x, rects[i].y);
                });

                let stream = canvas.export(exportOptions);
                return new Promise((resolve, reject) => {
                    stream.on("error", reject);
                    stream.pipe(concat({encoding: "buffer"}, resolve))
                })
            })
            .then(buffer => compressor ? compressor(buffer) : buffer)
            .then(buffer => promisify(fs.writeFile)(outputFileName, buffer));
        });
    }
};
