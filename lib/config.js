"use strict";

const _ = require("underscore");
const os = require("os");
const isCi = require("is-ci");

module.exports = class Config {
    constructor(input, env) {
        this.input = input;
        this.env = env || process.env;
    }

    get group_default() {
        return _.defaults(this.input.group_default || {}, {
            loading_stage: this.loading_stages[0],
            trim: true,
            jpeg: false,
            max_width: 2048,
            max_height: 1024,
            oversized_warning: false,
            padding: 1
        });
    }

    get groups() {
        return _.map(this.input.groups, group => _.defaults(group, this.group_default));
    }

    get scales() {
        return this.input.scales || {"full": {scale: 1, resolution: 1}};
    }

    get variations() {
        return this.input.variations;
    }

    get loading_stages() {
        return this.input.loading_stages || ["main"];
    }

    get concurrency_limit() {
        return this.input.image_processing_concurrency_limit ||
            this.input.concurrency_limit ||
            parseInt(this.env.IMAGE_PROCESSING_CONCURRENCY, 10) ||
            Math.max(os.cpus().length - 1, 1);
    }

    get show_progress() {
        if (this.input.show_progress === undefined) {
            return !isCi;
        } else {
            return this.input.show_progress;
        }
    }
}