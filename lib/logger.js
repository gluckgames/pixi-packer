"use strict";

const Spinner = require("cli-spinner").Spinner;

module.exports = class Logger {
    // handler has to expose error, info and warn
    constructor(handlers, showProgress) {
        ["error", "info", "warn"].forEach(key => {
            this[key] = function () {
                if (this.spinner) {
                    this.spinner.stop(true);
                }
                handlers[key].apply(console, arguments);
                if (this.spinner) {
                    this.spinner.start();
                }
            };
        });

        this.showProgress = showProgress;
    }

    /* Queue Progess support */
    addProgressWhile(queue, promise) {
        let updateTimer;
        if (this.showProgress) {
            this.spinner = new Spinner();
            this.spinner.setSpinnerString("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏");
            this.spinner.start();
            updateTimer = setInterval(() => {
                this.spinner.text = `Progressin - ${queue.remaining} remaining`;
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
}