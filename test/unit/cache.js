"use strict";

var Cache = require("../../lib/cache");
var path = require("path");
var assert = require("chai").assert;
var expect = require("chai").expect;
var sinon = require("sinon");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");
var imageSize = require("image-size");
var fs = require("fs");
var Q = require("q");

describe("Cache", function () {
    var tempPath, cache, log;

    beforeEach(function() {
        tempPath = path.join(__dirname, "../tmp");
        log = {info: sinon.spy()};
        cache = new Cache(tempPath, log);
        return Q.nfcall(rimraf, tempPath)
        .then(function() {
            return Q.nfcall(mkdirp, tempPath);
        })
        then(function() {
            return cache.load();
        });
    });

    afterEach(function() {
        return Q.nfcall(rimraf, tempPath);
    });

    it("calls cacheMiss when called the first time", function () {
        var cacheMiss = sinon.stub().returns(Promise.resolve({}));
        return cache.lookup("FOO", "BAR", cacheMiss)
        .then(function() {
            expect(cacheMiss.callCount).to.equal(1);
        });
    });

    it("does not call cacheMiss for the second time", function () {
        var cacheMiss = sinon.stub().returns(Promise.resolve({}));
        return cache.lookup("FOO", "BAR", cacheMiss)
        .then(function() {
            return cache.lookup("FOO", "BAR", cacheMiss);
        })
        .then(function() {
            expect(cacheMiss.callCount).to.equal(1);
        });
    });

    it("returns correct value", function () {
        var cacheMiss = sinon.stub().returns(Promise.resolve({"correct": "yes"}));
        return cache.lookup("FOO", "BAR", cacheMiss)
        .then(function(result) {
            expect(result.correct).to.equal("yes");
            return cache.lookup("FOO", "BAR", cacheMiss);
        })
        .then(function(result) {
            expect(result.correct).to.equal("yes");
        });
    });

    it("in case of a race condition cacheMiss is not called twice", function () {
        var delayedPromise = new Q.Promise(function(resolve) {
            setTimeout(function () { resolve({"correct": "yes"}); }, 50);
        });
        var cacheMiss = sinon.stub().returns(delayedPromise);

        var bothPromises = Q.all([
            cache.lookup("FOO", "BAR", cacheMiss),
            cache.lookup("FOO", "BAR", cacheMiss)
        ]);

        return bothPromises
        .then(function(results) {
            expect(results[0].correct).to.equal("yes");
            expect(results[1].correct).to.equal("yes");
            expect(cacheMiss.callCount).to.equal(1);
        })
    });
});
