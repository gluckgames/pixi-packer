"use strict";

let PixiPacker = require("../../index");
let path = require("path");
let expect = require("chai").expect;
let promisify = require("es6-promisify");
let rimraf = promisify(require("rimraf"));
let mkdirp = promisify(require("mkdirp"));
let fs = require("fs");
let imageSize = promisify(require("image-size"));
let pngQuant = require("imagemin-pngquant");

describe("Bug 1", function() {
    this.timeout(60000);
    let pixiPacker, config, tempPath, outputPath;

    before(() => {
        tempPath = path.join(__dirname, "../tmp");
        outputPath = path.join(__dirname, "../output");
        return Promise.all([
            rimraf(outputPath),
            rimraf(tempPath)
        ])
        .then(() => mkdirp(tempPath))
        .then(() => {
            config = {
                variations: ["main"],
                scales: {"half": {scale: 0.41, resolution: 1}},
                groups: [
                    {
                        id: "bug",
                        sprites: ["test/resources/bug_1/*.png"],
                        trim: false,
                        compressor: pngQuant()
                    }
                ]
            }

            pixiPacker = new PixiPacker(
                config,
                path.resolve(__dirname, "../.."),
                path.resolve(__dirname, outputPath),
                path.resolve(__dirname, tempPath)
            );

            return pixiPacker.process();
        });
    });

    after(() => {
        return Promise.all([
            rimraf(outputPath),
            rimraf(tempPath)
        ]);
    });

    it("does not overflow the size of the image", () => {
        let manifest = JSON.parse(fs.readFileSync(outputPath + "/main_main_half.json", "utf8"));
        return Promise.all(manifest.spritesheets.map(spritesheet => {
            return imageSize(outputPath + "/" + spritesheet.image)
            .then((size) => {
                spritesheet.sprites.forEach(sprite => {
                    expect(sprite.position.x + sprite.dimension.w).to.not.be.above(size.width);
                    expect(sprite.position.y + sprite.dimension.h).to.not.be.above(size.height);
                });
            });
        }));
    });
});
