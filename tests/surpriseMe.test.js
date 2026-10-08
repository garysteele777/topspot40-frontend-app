import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurprisePicker} from '../src/lib/interactions/surpriseMe.js';

function harness(random = () => 0) {
    /** @type {string[]} */
    const frames = [];
    /** @type {string[]} */
    const results = [];
    /** @type {Map<number | ReturnType<typeof setTimeout> | undefined, {fn: () => void, delay: number}>} */
    const pending = new Map();
    let id = 0, elapsed = 0;
    const picker = createSurprisePicker({
        random, onFrame: item => frames.push(item), onFinish: item => results.push(item),
        schedule: (fn, delay) => {pending.set(++id, {fn, delay}); return id;},
        cancel: id => pending.delete(id)
    });
    const flush = () => {
        while (pending.size) {
            const entry = pending.entries().next().value;
            if (!entry) break;
            const [id, {fn, delay}] = entry;
            pending.delete(id); elapsed += delay; fn();
        }
    };
    return {picker, frames, results, pending, flush, elapsed: () => elapsed};
}

test('holds the preselected result until the four-second animation ends', () => {
    let calls = 0;
    const h = harness(() => calls++ === 0 ? .99 : 0);
    h.picker.start(['first', 'last']);
    assert.deepEqual(h.results, []);
    assert.equal(h.frames[0], 'first');
    h.flush();
    assert.equal(h.elapsed(), 4000);
    assert.deepEqual(h.results, ['last']);
    assert.equal(h.frames.at(-1), 'last');
});
test('closing or restarting cancels the previous result', () => {
    const h = harness();
    h.picker.start(['old']);
    h.picker.stop(); h.flush();
    assert.deepEqual(h.results, []);
    h.picker.start(['old']); h.picker.start(['new']); h.flush();
    assert.deepEqual(h.results, ['new']);
});
test('empty choices do nothing; reduced motion reveals immediately', () => {
    const h = harness();
    h.picker.start([]);
    assert.equal(h.pending.size, 0);
    h.picker.start(['only'], true);
    assert.deepEqual(h.results, ['only']);
    assert.equal(h.pending.size, 0);
});

test('animation jumps to a different choice on each frame before settling', () => {
    const h = harness(() => 0);
    h.picker.start(['first', 'second', 'third']);
    h.flush();
    const animated = h.frames.slice(0, -1);
    assert.equal(animated.length, 12);
    for (let i = 1; i < animated.length; i++) {
        assert.notEqual(animated[i], animated[i - 1]);
    }
    assert.deepEqual(h.results, ['first']);
});
