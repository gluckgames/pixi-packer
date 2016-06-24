"use strict";

const _ = require("underscore");
const promisify = require("es6-promisify");
const mkdirp = promisify(require("mkdirp"));
const rimraf = promisify(require("rimraf"));
const Cache = require("./cache");
const Config = require("./config");
const Group = require("./group");
const LoadingManifest = require("./loading_manifest");
const ImageProcessor = require("./image_processor");
const Queue = require("./queue");
const Logger = require("./logger");

module.exports = class PixiPacker {
    constructor(config, inputPath, outputPath, cachePath) {
        this.config = new Config(config);
        this.inputPath = inputPath;
        this.outputPath = outputPath;
        this.cachePath = cachePath;
        this.imageProcessor = new ImageProcessor(config);
        this.log = console;
    }

    get log() {
        return this._log;
    }

    set log(logHandler) {
        this._log = new Logger(console, this.config.show_progress);
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
        let queue = new Queue(this.config.concurrency_limit);

        this.groups = this.config.groups.map(groupConfig => {
            return new Group(this.inputPath, groupConfig, this.config, cache, this.cachePath, this.imageProcessor, this.log);
        });

        return this.log.addProgressWhile(
            queue,
            Promise.all(this.groups.map(group => group.process(queue)))
        );
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
