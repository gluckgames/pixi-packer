"use strict";

var Queue = require("../../lib/queue");
var expect = require("chai").expect;
var sinon = require("sinon");

describe("Queue", () => {
    it("concurrency = 1", () => {
        let queue = new Queue(1);

        let resolve1, resolve2;
        let generator1 = sinon.stub().returns(new Promise(r => resolve1 = r));
        let generator2 = sinon.stub().returns(new Promise(r => resolve2 = r));

        let promise1 = queue.add(generator1);
        let promise2 = queue.add(generator2);

        expect(queue.remaining).to.equal(2);

        expect(generator1.callCount).to.equal(1);
        expect(generator2.callCount).to.equal(0);

        resolve1();

        return promise1
        .then(() => {
            expect(queue.remaining).to.equal(1);

            expect(generator1.callCount).to.equal(1);
            expect(generator2.callCount).to.equal(1);

            resolve2();

            return promise2;
        })
        .then(() => {
            expect(queue.remaining).to.equal(0);
        });
    });
});
