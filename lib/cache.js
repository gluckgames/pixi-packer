"use strict";

var Q = require("q");
var fs = require("fs");

module.exports = function Cache(tempPath, log) {
    var that = this;

    var filePath = tempPath + "/cache.json";
    var data = {};

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

    that.lookup = function(type, key, cacheMissFunction) {
        if (!data[type]) {
            data[type] = {};
        }

        if (data[type][key]) {
            return Q(data[type][key]);
        }

        return Q(cacheMissFunction())
        .then(function(result) {
            // Make sure we're only using serialisable results
            result = JSON.parse(JSON.stringify(result));
            data[type][key] = result;
            return result;
        });
    };

    that.save = function() {
        return Q.nfcall(fs.writeFile, filePath, JSON.stringify(data, null, 4));
    };
};
