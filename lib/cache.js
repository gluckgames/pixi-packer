"use strict";

let fs = require("fs-extra");
let promisify = require("es6-promisify");
var path = require("path");

module.exports = class Cache {
    constructor(tempPath, log) {
        this.filePath = tempPath + "/cache.json";
        this.tempPath = tempPath;
        this.data = {};
        this.log = log;
        this.cacheMissesCurrentlyInProgress = {};
    }

    load() {
        return promisify(fs.readFile)(this.filePath)
        .then(raw => this.data = JSON.parse(raw))
        .catch(() => {
            // This failure is recoverable (and even expected in case of a cold cache)
            this.log.info("Using fresh cache for %s", this.filePath);
        })
        .then(() => this);
    }

    lookup(type, key, cacheMissFunction, version) {
        version = version || 0;

        if (!this.data[type]) {
            this.data[type] = {};
        }

        if (this.data[type][key] && this.data[type][key].version === version) {
            return Promise.resolve(this.data[type][key].data);
        }


        // This bit of code avoids a race condition between two lookups for the same type/key
        // Without this cacheMissFunction would be called twice
        this.cacheMissesCurrentlyInProgress[type] = this.cacheMissesCurrentlyInProgress[type] || {};
        if (!this.cacheMissesCurrentlyInProgress[type][key]) {
            this.cacheMissesCurrentlyInProgress[type][key] = Promise.resolve()
            .then(() => cacheMissFunction())
            .then((result) => {
                delete this.cacheMissesCurrentlyInProgress[type][key];
                return result;
            });
        }

        return this.cacheMissesCurrentlyInProgress[type][key]
        .then((result) => {
            // Make sure we're only using serialisable results
            result = JSON.parse(JSON.stringify(result));
            this.data[type][key] = {
                version: version,
                data: result
            };
            return result;
        });
    };

    save() {
        return promisify(fs.writeFile)(this.filePath, JSON.stringify(this.data, null, 4));
    }

    getCachePath(basename) {
        return path.join(this.tempPath, basename);
    }
};
