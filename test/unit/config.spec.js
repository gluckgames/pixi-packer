"use strict";

var Config = require("../../lib/config");
var expect = require("chai").expect;
var sinon = require("sinon");

describe("Config", () => {
    context("groups", () => {
        it("are returned correctly", () => {
            let config = new Config({
                groups: [{id: "foo"}, {id: "bar", jpeg: true}]
            });

            expect(config.groups.length).to.equal(2);
            expect(config.groups[0].id).to.equal("foo");
            expect(config.groups[1].id).to.equal("bar");
            expect(config.groups[1].jpeg).to.equal(true);
        });

        it("explicit defaults are correctly applied", () => {
            let config = new Config({
                group_default: {trim: false},
                groups: [{id: "foo"}, {id: "bar", trim: true}]
            });

            expect(config.groups[0].trim).to.equal(false);
            expect(config.groups[1].trim).to.equal(true);
        });

        it("implicit defaults are correctly applied", () => {
            let config = new Config({
                groups: [{id: "foo"}, {id: "bar", jpeg: true}]
            });

            expect(config.groups[0].trim).to.equal(true);
            expect(config.groups[1].trim).to.equal(true);
            expect(config.groups[0].jpeg).to.equal(false);
            expect(config.groups[1].jpeg).to.equal(true);
        });
    });

    context("scales", () => {
        it("are returned correctly", () => {
            let config = new Config({
                scales: {foo: {scale: 1}, bar: {scale: 2}}
            });

            expect(config.scales.foo.scale).to.equal(1);
            expect(config.scales.bar.scale).to.equal(2);
        });

        it("defaults correctly", () => {
            let config = new Config({});
            expect(config.scales).to.deep.equal({full: {resolution: 1, scale: 1}});
        });
    });

    context("variations", () => {
        it("are returned correctly", () => {
            let config = new Config({ variations: ["foo", "bar"] });
            expect(config.variations).to.deep.equal(["foo", "bar"]);
        });
    });

    context("loading_stages", () => {
        it("are returned correctly", () => {
            let config = new Config({ loading_stages: ["first", "second"] });
            expect(config.loading_stages).to.deep.equal(["first", "second"]);
        });

        it("defaults correctly", () => {
            let config = new Config({});
            expect(config.loading_stages).to.deep.equal(["main"]);
        });
    });

    context("spritesheet", () => {
        it("are returned correctly", () => {
            let config = new Config({ spritesheet: {padding: 5} });
            expect(config.spritesheet.padding).to.equal(5);
        });

        it("defaults correctly", () => {
            let config = new Config({});
            expect(config.spritesheet.max_width).to.equal(2048);
            expect(config.spritesheet.max_height).to.equal(1024);
            expect(config.spritesheet.oversized_warning).to.equal(false);
            expect(config.spritesheet.padding).to.equal(2);
        });
    });
});
