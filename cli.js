#!/usr/bin/env node
"use strict";

const PixiPacker = require("./index");
const path = require("path");
const cliCursor = require("cli-cursor");

var yargs = require("yargs")
    .usage(
        "Usage: pixi-packer /path/to/resource-file.json /path/to/output"
    )
    .strict()
    .boolean("clean-cache")
    .boolean("clean-output")
    .boolean("clean")
    .boolean("quiet")
    .boolean("debug")
    .describe("cache", "path to cache folder. Will be created if necassary. Defaults to ~/.pixi-packer-tmp")
    .describe("clean-cache", "empties cache folder before processing")
    .describe("clean-output", "empties output folder before processing")
    .describe("clean", "empties both cache and output folder before processing")
    .describe("quiet", "Surpressses log output apart from errors")
    .describe("debug", "Enable better stack traces at the cost of performance")
    .alias("q", "quiet")
    .demand(2);

var argv = yargs.argv;

var resourceFilePath = path.resolve(argv._[0]);
var outputPath = path.resolve(argv._[1]);

var config = require(resourceFilePath);
var inputPath = path.dirname(resourceFilePath);
var cachePath = argv.cache || path.join(process.env.HOME || process.env.USERPROFILE, ".pixi-packer-tmp");

var pixiPacker = new PixiPacker(config, inputPath, outputPath, cachePath);

if (argv.quiet) {
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

cliCursor.hide();

pixiPacker.process()
.catch(err => {
    console.error("Error:", err.stack);
    /* eslint no-process-exit:0 */
    process.exit(1);
});
