"use strict";

var Q = require("q");
var _ = require("underscore");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var Cache = require("./cache");
var Group = require("./group");
var LoadingManifest = require("./loading_manifest");
var ImageProcessor = require("./image_processor");

module.exports = function PixiPacker(config, inputPath, outputPath, cachePath) {
    var that = this;
    that.log = console;

    var imageProcessor = new ImageProcessor(config);

    function cleanIfNeeded() {
        return Q.fcall(function() {
            if (config.cleanCache) {
                that.log.info("Cleaning cache folder");
                return Q.nfcall(rimraf, cachePath);
            }
        })
        .then(function() {
            if (config.cleanOutput) {
                that.log.info("Cleaning output folder");
                return Q.nfcall(rimraf, outputPath);
            }
        });
    }

    function ensurePathsExist() {
        return Q.all([
            Q.nfcall(mkdirp, outputPath),
            Q.nfcall(mkdirp, cachePath)
        ]);
    }

    function createCache() {
        return new Cache(cachePath, that.log).load();
    }

    function createAndProcessGroups(cache) {
        that.groups = config.groups.map(function(groupConfig) {
            return new Group(inputPath, groupConfig, config, cache, cachePath, imageProcessor, that.log);
        });
        return Q.all(_.invoke(that.groups, "process"));
    }

    function createAndSaveLoadingManifests(groups) {
        return _.flatten(
            _.map(config.scales, function(scale, scaleName) {
                return _.map(config.variations, function(variation) {
                    return _.map(config.loading_stages, function(loadingStage) {
                        var loadingManifest = new LoadingManifest(groups, scaleName, scale.resolution, variation, loadingStage, that.log);
                        return loadingManifest.save(outputPath);
                    });
                });
            })
        );
    }

    that.process = function() {
        return cleanIfNeeded()
        .then(ensurePathsExist)
        .then(createCache)
        .then(function(cache) {
            return createAndProcessGroups(cache)
            .then(function(groups) {
                // Save in case error occurs during createAndSaveLoadingManifests step
                cache.save();
                return groups;
            })
            .then(createAndSaveLoadingManifests)
            .then(cache.save);
        })
        .then(function() {
            return Q.all(_.invoke(that.groups, "copy", outputPath));
        })
        .then(function() { return that; });
    };
};
