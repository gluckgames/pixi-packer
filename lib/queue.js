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

    drainWhile(title, promise, showProgress) {
        let updateTimer;
        if (showProgress) {
            this.spinner = new Spinner();
            this.spinner.setSpinnerString("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏");
            this.spinner.start();
            updateTimer = setInterval(() => {
                this.spinner.text = `${title} - ${this.remaining} remaining`;
            }, this.spinner.delay);
        }

        return promise
        .then(result => {
            if (this.spinner) {
                this.spinner.stop(true);
                clearTimeout(updateTimer);
                delete this.spinner;
            }
            return result;
        });
    }


    stop() {
        if (this.spinner) {
            this.spinner.stop(true);
        }
    }

    resume() {
        if (this.spinner) {
            this.spinner.start();
        }
    }
}