"use strict";

let PixiPacker = require("../../index");
let path = require("path");
let expect = require("chai").expect;
let promisify = require("es6-promisify");
let rimraf = promisify(require("rimraf"));
let mkdirp = promisify(require("mkdirp"));
let fs = require("fs");

describe("Full run", function() {
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
            config = require("../../example.js");

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

    it("creates an output directory", () => {
        expect(fs.lstatSync(outputPath).isDirectory()).to.equal(true);
    });

    it("creates an manifests", () => {
        expect(fs.lstatSync(outputPath + "/game_EN_web.json").isFile()).to.equal(true);
        expect(fs.lstatSync(outputPath + "/game_DE_web.json").isFile()).to.equal(true);
        expect(fs.lstatSync(outputPath + "/game_EN_web_retina.json").isFile()).to.equal(true);
        expect(fs.lstatSync(outputPath + "/game_DE_web_retina.json").isFile()).to.equal(true);
        expect(fs.lstatSync(outputPath + "/menu_EN_web.json").isFile()).to.equal(true);
        expect(fs.lstatSync(outputPath + "/menu_DE_web.json").isFile()).to.equal(true);
        expect(fs.lstatSync(outputPath + "/menu_EN_web_retina.json").isFile()).to.equal(true);
        expect(fs.lstatSync(outputPath + "/menu_DE_web_retina.json").isFile()).to.equal(true);
    });

    it("has the right resolution", () => {
        let manifest = JSON.parse(fs.readFileSync(outputPath + "/game_DE_web_retina.json", "utf8"));
        expect(manifest.resolution).to.equal(2);
    });

    it("creates all images", () => {
        let manifest = JSON.parse(fs.readFileSync(outputPath + "/game_DE_web_retina.json", "utf8"));
        expect(manifest.spritesheets.length).to.be.greaterThan(0);
        manifest.spritesheets.forEach(spritesheet => {
            expect(fs.lstatSync(outputPath + "/" + spritesheet.image).isFile()).to.equal(true);
        });
    });
});
