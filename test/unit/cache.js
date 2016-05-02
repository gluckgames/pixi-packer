"use strict";

var Cache = require("../../lib/cache");
var path = require("path");
var expect = require("chai").expect;
var sinon = require("sinon");
let promisify = require("es6-promisify");
var mkdirp = promisify(require("mkdirp"));
var rimraf = promisify(require("rimraf"));

describe("Cache", () => {
    var tempPath, cache, log;

    beforeEach(() => {
        tempPath = path.join(__dirname, "../tmp");
        log = {info: sinon.spy()};
        cache = new Cache(tempPath, log);
        return rimraf(tempPath)
        .then(() => mkdirp(tempPath))
        .then(() => cache.load());
    });

    afterEach(() => {
        return rimraf(tempPath);
    });

    it("calls cacheMiss when called the first time", () => {
        var cacheMiss = sinon.stub().returns(Promise.resolve({}));
        return cache.lookup("FOO", "BAR", cacheMiss)
        .then(() => {
            expect(cacheMiss.callCount).to.equal(1);
        });
    });

    it("does not call cacheMiss for the second time", () => {
        var cacheMiss = sinon.stub().returns(Promise.resolve({}));
        return cache.lookup("FOO", "BAR", cacheMiss)
        .then(() => cache.lookup("FOO", "BAR", cacheMiss))
        .then(() => {
            expect(cacheMiss.callCount).to.equal(1);
        });
    });

    it("returns correct value", () => {
        var cacheMiss = sinon.stub().returns(Promise.resolve({"correct": "yes"}));
        return cache.lookup("FOO", "BAR", cacheMiss)
        .then((result) => {
            expect(result.correct).to.equal("yes");
            return cache.lookup("FOO", "BAR", cacheMiss);
        })
        .then((result) => {
            expect(result.correct).to.equal("yes");
        });
    });

    it("in case of a race condition cacheMiss is not called twice", () => {
        var delayedPromise = new Promise(resolve => {
            setTimeout(() => { resolve({"correct": "yes"}); }, 50);
        });
        var cacheMiss = sinon.stub().returns(delayedPromise);

        var bothPromises = Promise.all([
            cache.lookup("FOO", "BAR", cacheMiss),
            cache.lookup("FOO", "BAR", cacheMiss)
        ]);

        return bothPromises
        .then(results => {
            expect(results[0].correct).to.equal("yes");
            expect(results[1].correct).to.equal("yes");
            expect(cacheMiss.callCount).to.equal(1);
        });
    });
});
