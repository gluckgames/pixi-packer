"use strict";

let _ = require("underscore");
let promisify = require("es6-promisify");
let mkdirp = promisify(require("mkdirp"));
let rimraf = promisify(require("rimraf"));
let Cache = require("./cache");
let Config = require("./config");
let Group = require("./group");
let LoadingManifest = require("./loading_manifest");
let ImageProcessor = require("./image_processor");

module.exports = class PixiPacker {
    constructor(config, inputPath, outputPath, cachePath) {
        this.config = new Config(config);
        this.inputPath = inputPath;
        this.outputPath = outputPath;
        this.cachePath = cachePath;
        this.imageProcessor = new ImageProcessor(config);
        this.log = console;
    }

    cleanIfNeeded() {
        return Promise.resolve()
        .then(() => {
            if (this.config.cleanCache) {
                this.log.info("Cleaning cache folder");
                return rimraf(this.cachePath);
            }
        })
        .then(() => {
            if (this.config.cleanOutput) {
                this.log.info("Cleaning output folder");
                return rimraf(this.outputPath);
            }
        });
    }

    ensurePathsExist() {
        return Promise.all([
            mkdirp(this.outputPath),
            mkdirp(this.cachePath)
        ]);
    }

    createCache() {
        return new Cache(this.cachePath, this.log).load();
    }

    createAndProcessGroups(cache) {
        this.groups = this.config.groups.map(groupConfig => {
            return new Group(this.inputPath, groupConfig, this.config, cache, this.cachePath, this.imageProcessor, this.log);
        });
        return Promise.all(_.invoke(this.groups, "process"));
    }

    createAndSaveLoadingManifests(groups) {
        _.each(this.config.scales, (scale, scaleName) => {
            return this.config.variations.map(variation => {
                return this.config.loading_stages.map(loadingStage => {
                    let loadingManifest = new LoadingManifest(groups, scaleName, scale.resolution, variation, loadingStage, this.log);
                    return loadingManifest.save(this.outputPath);
                });
            });
        });
    }

    process() {
        return this.cleanIfNeeded()
        .then(() => this.ensurePathsExist())
        .then(() => this.createCache())
        .then(cache => {
            return this.createAndProcessGroups(cache)
            .then(groups => {
                // Save in case error occurs during createAndSaveLoadingManifests step
                cache.save();
                return groups;
            })
            .then(groups => this.createAndSaveLoadingManifests(groups))
            .then(() => cache.save());
        })
        .then(() => Promise.all(_.invoke(this.groups, "copy", this.outputPath)))
        .then(() => this);
    };
};
