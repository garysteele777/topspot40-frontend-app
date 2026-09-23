// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {createEstimatedTrackClock} = await import(
    '../src/lib/carmode/EstimatedTrackClock.ts'
);

test('Nostalgia Auto Play estimates elapsed Spotify time and freezes it on transition or pause', () => {
    let now = 10_000;
    let tick = null;
    let cleared = 0;
    const timings = [];
    const clock = createEstimatedTrackClock({
        now: () => now,
        setTiming: timing => timings.push(timing),
        setInterval: callback => {
            tick = callback;
            return 1;
        },
        clearInterval: () => { cleared += 1; tick = null; }
    });

    clock.start(180);
    now += 12_600;
    tick();

    assert.deepEqual(timings.at(-1), {
        elapsed: 12,
        duration: 180,
        progress: 12 / 180 * 100
    });

    clock.stop();
    now += 10_000;
    assert.equal(tick, null);
    assert.equal(cleared, 1);
    assert.deepEqual(timings.at(-1), {
        elapsed: 12,
        duration: 180,
        progress: 12 / 180 * 100
    });
});
