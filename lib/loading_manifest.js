"use strict";

var _ = require("underscore");
var fs = require("fs");
var Q = require("q");

module.exports = function LoadingManifest(groups, scaleName, scaleResolution, variation, loadingStage, log) {
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
            resolution: scaleResolution,
            meta: {
                type: "pixi-packer",
                version: "1",
                app: "https://github.com/gamevy/pixi-packer"
            }
        };

        var totalSize = 0;
        var totalFiles = 0;
        var names = {};
        var nameToGroup = {};

        manifestRaw.spritesheets = _.flatten(_.map(getScaledGroups(), function(scaledGroup) {
            _.each(scaledGroup.spritesheets, function(spritesheet) {
                totalSize += spritesheet.outputFilesize;
                totalFiles++;
            });

            return _.map(scaledGroup.spritesheets, function(spritesheet) {
                _.each(spritesheet.loadingInformation, function(sprite) {

                    if (nameToGroup[sprite.name]) {
                        throw new Error("Sprite " + sprite.name + " exists twice in manifest " + scaleName + ". " +
                            "Contained groups: " + scaledGroup.groupId + ", " + nameToGroup[sprite.name]);
                    }
                    nameToGroup[sprite.name] = scaledGroup.groupId;
                    names[sprite.name] = true;
                });

                return {
                    image: spritesheet.getBasename(),
                    filesize: spritesheet.outputFilesize,
                    sprites: spritesheet.loadingInformation
                };
            });
        }));

        log.info("%s: %d spritesheets, %sMB",
            id, totalFiles, (totalSize / 1e+6).toFixed(2));

        return Q.nfcall(fs.writeFile, outputPath + "/" + id + ".json", JSON.stringify(manifestRaw, null, 4));
    };
};
