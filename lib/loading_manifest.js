"use strict";

let _ = require("underscore");
let fs = require("fs");
let promisify = require("es6-promisify");
let filesize = require("filesize");

module.exports = class LoadingManifest{
    constructor(groups, scaleName, scaleResolution, variation, loadingStage, log) {
        this.groups = groups;
        this.scaleName = scaleName;
        this.scaleResolution = scaleResolution;
        this.variation = variation;
        this.loadingStage = loadingStage;
        this.log = log;
    }

    getScaledGroups() {
        return _.chain(this.groups)
            .filter(group =>  group.loadingStage === this.loadingStage)
            .filter(group => !group.variation || group.variation === this.variation)
            .map(group => group.getScaledGroup(this.scaleName))
            .value();
    }

    save(outputPath) {
        let id = this.loadingStage + "_" + this.variation + "_" + this.scaleName;
        let manifestRaw = {
            scaleName: this.scaleName,
            variation: this.variation,
            loadingStage: this.loadingStage,
            id,
            resolution: this.scaleResolution,
            meta: {
                type: "pixi-packer",
                version: "1",
                app: "https://github.com/gamevy/pixi-packer"
            }
        };

        let totalSize = 0;
        let totalFiles = 0;
        let names = {};
        let nameToGroup = {};

        manifestRaw.spritesheets = _.flatten(this.getScaledGroups().map(scaledGroup => {
            scaledGroup.spritesheets.forEach(spritesheet => {
                totalSize += spritesheet.outputFilesize;
                totalFiles++;
            });

            return scaledGroup.spritesheets.map(spritesheet => {
                spritesheet.loadingInformation.forEach(sprite => {
                    if (nameToGroup[sprite.name]) {
                        throw new Error("Sprite " + sprite.name + " exists twice in manifest " + this.scaleName + ". " +
                            "Contained groups: " + scaledGroup.groupId + ", " + nameToGroup[sprite.name]);
                    }
                    nameToGroup[sprite.name] = scaledGroup.groupId;
                    names[sprite.name] = true;
                });

                return {
                    image: spritesheet.basename,
                    filesize: spritesheet.outputFilesize,
                    sprites: spritesheet.loadingInformation
                };
            });
        }));

        this.log.info("%s: %d spritesheets, %s", id, totalFiles, filesize(totalSize));

        return promisify(fs.writeFile)(outputPath + "/" + id + ".json", JSON.stringify(manifestRaw, null, 4));
    };
};
