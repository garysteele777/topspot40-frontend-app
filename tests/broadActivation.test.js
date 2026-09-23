// @ts-nocheck -- Node test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBroadActivation} from '../src/lib/interactions/broadActivation.js';

function pointer(pointerId, clientX, clientY) {
    return {pointerId, clientX, clientY, isPrimary: true};
}

function setup() {
    let activations = 0;
    const activation = createBroadActivation({
        onActivate: () => { activations += 1; }
    });
    return {activation, get activations() { return activations; }};
}

test('a general page tap continues to the next track', () => {
    const screen = setup();
    screen.activation.pointerDown(pointer(1, 20, 20));
    screen.activation.pointerUp(pointer(1, 20, 20));
    assert.equal(screen.activations, 1);
});

test('a title or empty-card-area tap continues to the next track', () => {
    const screen = setup();
    screen.activation.pointerDown(pointer(1, 120, 80));
    screen.activation.pointerUp(pointer(1, 120, 80));
    assert.equal(screen.activations, 1);
});

test('Guided Playback has no broad overlay activation after moving to explicit controls', () => {
    const panel = readFileSync(
        new URL('../src/lib/components/car/GuidedPlaybackPanel.svelte', import.meta.url),
        'utf8'
    );
    assert.doesNotMatch(panel, /createBroadActivation|handlePrimaryPointer|continueActivation/);
    assert.match(panel, /Open this song in Spotify/);
    assert.match(panel, /Continue the program/);
});

test('rapid page taps continue only once', () => {
    const screen = setup();
    screen.activation.pointerDown(pointer(1, 20, 20));
    screen.activation.pointerUp(pointer(1, 20, 20));
    screen.activation.pointerDown(pointer(2, 20, 20));
    screen.activation.pointerUp(pointer(2, 20, 20));
    assert.equal(screen.activations, 1);
});

test('scrolling or dragging does not continue to the next track', () => {
    const screen = setup();
    screen.activation.pointerDown(pointer(1, 20, 20));
    screen.activation.pointerUp(pointer(1, 20, 60));
    assert.equal(screen.activations, 0);
});
