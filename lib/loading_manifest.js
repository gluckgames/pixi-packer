"use strict";

var _ = require("underscore");
var fs = require("fs");
var Q = require("q");

module.exports = function LoadingManifest(groups, scaleName, variation, loadingStage, log) {
    var that = this;

    function getScaledGroups() {
        return _.chain(groups)
            .filter(function(group) {
                return group.loadingStage === loadingStage;
            })
            .filter(function(group) {
                return !group.variation || group.variation === variation;
            })
            .map(function(group) {
                return group.getScaledGroup(scaleName);
            })
            .value();
    }

    that.save = function(outputPath) {
        var id = loadingStage + "_" + variation + "_" + scaleName;
        var manifestRaw = {
            scaleName: scaleName,
            variation: variation,
            loadingStage: loadingStage,
            id: id,
            frames: {},
            meta: {
                app: "https://github.com/gamevy/pixi-packer",
                images: [],
                scale: 1
            }
        };

        var totalSize = 0;
        var totalFiles = 0;

        _.each(getScaledGroups(), function(scaledGroup) {
            manifestRaw.meta.images = manifestRaw.meta.images.concat(scaledGroup.getImagePaths());
            _.each(scaledGroup.getLoadingInformation(), function(information) {
                if (manifestRaw.frames[information.name]) {
                    throw new Error("Sprite " + information.name + " exists twice");
                }
                manifestRaw.frames[information.name] = information;
            });
            _.each(scaledGroup.spritesheets, function(spritesheet) {
                totalSize += spritesheet.outputFilesize;
                totalFiles++;
            });
        });

        log.info("%s: %d spritesheets, %sMB",
            id, totalFiles, (totalSize / 1e+6).toFixed(2));

        return Q.nfcall(fs.writeFile, outputPath + "/" + id + ".json", JSON.stringify(manifestRaw, null, 4));
    };
};
