#!/usr/bin/env node
"use strict";

var PixiPacker = require("./index");
var path = require("path");

var yargs = require("yargs")
    .usage(
        "Usage: pixi-packer /path/to/resource-file.json /path/to/output"
    )
    .strict()
    .boolean("clean-cache")
    .boolean("clean-output")
    .boolean("clean")
    .boolean("quite")
    .boolean("debug")
    .describe("cache", "path to cache folder. Will be created if necassary. Defaults to ~/.pixi-packer-tmp")
    .describe("clean-cache", "empties cache folder before processing")
    .describe("clean-output", "empties output folder before processing")
    .describe("clean", "empties both cache and output folder before processing")
    .describe("quite", "Surpressses log output apart from errors")
    .describe("debug", "Enable better stack traces at the cost of performance")
    .alias("q", "quite")
    .demand(2);

var argv = yargs.argv;

var resourceFilePath = path.resolve(argv._[0]);
var outputPath = path.resolve(argv._[1]);

var config = require(resourceFilePath);
var inputPath = path.dirname(resourceFilePath);
var cachePath = argv.cache || path.join(process.env.HOME || process.env.USERPROFILE, ".pixi-packer-tmp");

var pixiPacker = new PixiPacker(config, inputPath, outputPath, cachePath);

if (argv.quite) {
    pixiPacker.log = {log: function() {}, error: console.error, info: function() {}, warn: function() {}};
}

if (argv.clean) {
    config.cleanCache = true;
    config.cleanOutput = true;
} else {
    config.cleanCache = argv["clean-cache"];
    config.cleanOutput = argv["clean-output"];
}

config.trim = true;

if (argv.debug) {
    require("q").longStackSupport = true;
}

pixiPacker.process()
.catch(err => {
    console.error("Error:", err);
    /* eslint no-process-exit:0 */
    process.exit(1);
});
