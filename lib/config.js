"use strict";

let _ = require("underscore");

module.exports = class Config {
    constructor(input) {
        this.input = input;
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
}