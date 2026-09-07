// @ts-nocheck -- exercises the small Car Mode analytics state helper directly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFile } from 'node:fs/promises';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {
    buildProgramStartedProperties,
    createProgramStartedTracker
} = await import('../src/lib/carmode/CarModeAnalytics.ts');

test('program started is captured only once for one loaded playback session', () => {
    const events = [];
    const tracker = createProgramStartedTracker({
        capture: properties => events.push(properties),
        alreadyStarted: false
    });

    tracker.captureOnce({ program_type: 'PROGRAM_DG', playback_method: 'guided' });
    tracker.captureOnce({ program_type: 'PROGRAM_DG', playback_method: 'guided' });
    tracker.captureOnce({ program_type: 'PROGRAM_DG', playback_method: 'guided' });

    assert.deepEqual(events, [
        { program_type: 'PROGRAM_DG', playback_method: 'guided' }
    ]);
});

test('a preferences return can preserve that the same program was already started', () => {
    const events = [];
    const tracker = createProgramStartedTracker({
        capture: properties => events.push(properties),
        alreadyStarted: true
    });

    tracker.captureOnce({ program_type: 'PROGRAM_COL', playback_method: 'automatic' });

    assert.deepEqual(events, []);
});

test('a fresh loaded program gets a fresh tracker and may capture again', () => {
    const firstEvents = [];
    const first = createProgramStartedTracker({
        capture: properties => firstEvents.push(properties),
        alreadyStarted: false
    });

    first.captureOnce({ program_type: 'PROGRAM_DG', playback_method: 'guided' });

    const secondEvents = [];
    const second = createProgramStartedTracker({
        capture: properties => secondEvents.push(properties),
        alreadyStarted: false
    });

    second.captureOnce({ program_type: 'PROGRAM_DG', playback_method: 'guided' });

    assert.equal(firstEvents.length, 1);
    assert.equal(secondEvents.length, 1);
});

test('program started properties use stable decade-genre selection fields', () => {
    assert.deepEqual(
        buildProgramStartedProperties(
            {
                programType: 'PROGRAM_DG',
                mode: 'decade_genre',
                language: 'en',
                context: {
                    decade: '1980s',
                    genre: 'pop'
                }
            },
            'guided'
        ),
        {
            program_type: 'PROGRAM_DG',
            mode: 'decade_genre',
            language: 'en',
            playback_method: 'guided',
            decade: '1980s',
            genre: 'pop'
        }
    );
});

test('program started properties include stable collection and artist identifiers without artist name', () => {
    assert.deepEqual(
        buildProgramStartedProperties(
            {
                programType: 'PROGRAM_ARTIST',
                mode: 'artist_spotlight',
                language: 'es',
                context: {
                    artist_id: 'artist-123',
                    artist_name: 'Do Not Send This',
                    genre: 'rock',
                    collection_slug: 'unused'
                }
            },
            'automatic'
        ),
        {
            program_type: 'PROGRAM_ARTIST',
            mode: 'artist_spotlight',
            language: 'es',
            playback_method: 'automatic',
            genre: 'rock',
            collection_slug: 'unused',
            artist_id: 'artist-123'
        }
    );
});

test('an existing tracker can be marked already started for a preferences return', () => {
    const events = [];
    const tracker = createProgramStartedTracker({
        capture: properties => events.push(properties),
        alreadyStarted: false
    });

    tracker.markStarted();
    tracker.captureOnce({
        program_type: 'PROGRAM_DG',
        playback_method: 'guided'
    });

    assert.deepEqual(events, []);
});

test('Car Mode routes both user playback handlers through the one-time program-start capture', async () => {
    const page = await readFile(
        new URL('../src/routes/car-page/+page.svelte', import.meta.url),
        'utf8'
    );

    const guidedHandler = page.match(
        /async function handleGuidedPlay\(\)\s*\{([\s\S]*?)\n\s*\}/
    );
    const autoHandler = page.match(
        /async function handleAutoPlay\(\)\s*\{([\s\S]*?)\n\s*\}/
    );

    assert.ok(guidedHandler);
    assert.ok(autoHandler);

    assert.match(guidedHandler[1], /if \(!\$currentTrack\) return;/);
    assert.match(guidedHandler[1], /captureProgramStartedOnce\(\)/);
    assert.match(autoHandler[1], /if \(!\$currentTrack\) return;/);
    assert.match(autoHandler[1], /captureProgramStartedOnce\(\)/);
});

test('program started tracker exposes whether the event has already been captured', () => {
    const tracker = createProgramStartedTracker({
        capture: () => {},
        alreadyStarted: false
    });

    assert.equal(tracker.hasStarted(), false);

    tracker.captureOnce({
        program_type: 'PROGRAM_DG',
        playback_method: 'guided'
    });

    assert.equal(tracker.hasStarted(), true);
});
