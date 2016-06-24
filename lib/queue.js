"use strict";

const PromiseQueue = require("promise-queue");
const Spinner = require("cli-spinner").Spinner;

module.exports = class Queue {
    constructor(concurrency) {
        this.queue = new PromiseQueue(concurrency);
        this.remaining = 0;
    }

    add(generator) {
        this.remaining++
        return this.queue.add(generator)
        .then(result => {
            this.remaining--;
            return result;
        });
    }
}