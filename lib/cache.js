"use strict";

var Q = require("q");
var fs = require("fs");

module.exports = function Cache(tempPath, log) {
    var that = this;

    var filePath = tempPath + "/cache.json";
    var data = {};

    var cacheMissesCurrentlyInProgress = {};

    that.load = function() {

        return Q.nfcall(fs.readFile, filePath)
        .then(function(raw) {
            data = JSON.parse(raw);
        })
        .fail(function() {
            // This failure is recoverable (and even expected in case of a cold cache)
            log.info("Using fresh cache for %s", filePath);
        })
        .then(function() { return that; });
    };

    that.lookup = function(type, key, cacheMissFunction, version) {
        version = version || 0;

        if (!data[type]) {
            data[type] = {};
        }

        if (data[type][key] && data[type][key].version === version) {
            return Q(data[type][key].data);
        }

        // This bit of code avoids a race condition between two lookups for the same type/key
        // Without this cacheMissFunction would be called twice
        cacheMissesCurrentlyInProgress[type] = cacheMissesCurrentlyInProgress[type] || {};
        if (!cacheMissesCurrentlyInProgress[type][key]) {
            cacheMissesCurrentlyInProgress[type][key] = Q(cacheMissFunction())
            .then(function(result) {
                delete cacheMissesCurrentlyInProgress[type][key];
                return result;
            });
        }

        return cacheMissesCurrentlyInProgress[type][key]
        .then(function(result) {
            // Make sure we're only using serialisable results
            result = JSON.parse(JSON.stringify(result));
            data[type][key] = {
                version: version,
                data: result
            };
            return result;
        });
    };

    that.save = function() {
        return Q.nfcall(fs.writeFile, filePath, JSON.stringify(data, null, 4));
    };
};
