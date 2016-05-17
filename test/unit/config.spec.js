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
            expect(config.groups[0].max_width).to.equal(2048);
            expect(config.groups[0].max_height).to.equal(1024);
            expect(config.groups[0].oversized_warning).to.equal(false);
            expect(config.groups[0].padding).to.equal(1);
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

    context("concurrency_limit", () => {
        it("defaults correctly", () => {
            let config = new Config({});
            expect(config.concurrency_limit).to.be.greaterThan(0);
        });

        it("reads image_processing_concurrency_limit", () => {
            let config = new Config({image_processing_concurrency_limit: 7});
            expect(config.concurrency_limit).to.be.equal(7);
        });

        it("reads concurrency_limit", () => {
            let config = new Config({concurrency_limit: 15});
            expect(config.concurrency_limit).to.be.equal(15);
        });

        it("reads IMAGE_PROCESSING_CONCURRENCY env var", () => {
            let config = new Config({}, {IMAGE_PROCESSING_CONCURRENCY: 10});
            expect(config.concurrency_limit).to.be.equal(10);
        });
    });

    context("show_progress", () => {
        it("reads the correct field", () => {
            let config = new Config({show_progress: true});
            expect(config.show_progress).to.be.equal(true);
        })
    });

    context("post_processing", () => {
        it("are returned correctly", () => {
            let config = new Config({ post_processing: {foo: {bar: "something"}} });
            expect(config.post_processing.foo.bar).to.deep.equal("something");
        });

        it("defaults correctly", () => {
            let config = new Config({});
            expect(config.post_processing).to.deep.equal({});
        });
    });
});
