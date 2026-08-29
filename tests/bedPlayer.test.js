// @ts-nocheck -- executed directly by Node's built-in test runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const audioElements = [];
const sourceNodes = [];

class FakeAudio {
    constructor() {
        this.paused = true;
        this.muted = false;
        this.volume = 1;
        this.currentTime = 0;
        this.loop = false;
        this.preload = '';
        this.crossOrigin = null;
        this.attributes = new Map();
        audioElements.push(this);
    }

    set src(value) {
        this.srcAssignments ??= [];
        this.srcAssignments.push({value, crossOrigin: this.crossOrigin});
        this._src = value;
    }

    get src() { return this._src ?? ''; }
    get readyState() { return 4; }
    get networkState() { return 1; }
    get duration() { return 30; }
    setAttribute(key, value) { this.attributes.set(key, value); }
    async play() { this.paused = false; }
    pause() { this.paused = true; }
}

class FakeGain {
    constructor() { this.gain = {value: 1}; }
    connect(destination) { this.destination = destination; }
}

class FakeAudioContext {
    constructor() {
        this.state = 'suspended';
        this.destination = {name: 'destination'};
    }

    createGain() { this.gain = new FakeGain(); return this.gain; }
    createMediaElementSource(audio) {
        const source = {
            audio,
            connectedTo: null,
            disconnected: false,
            connect: target => { source.connectedTo = target; },
            disconnect: () => { source.disconnected = true; }
        };
        sourceNodes.push(source);
        return source;
    }

    async resume() { this.state = 'running'; }
}

globalThis.Audio = FakeAudio;
globalThis.window = {};
globalThis.fetch = async () => ({ok: true});

const {BED_VOLUME} = await import('../src/lib/audio/audioLevels.ts');
const {startBedUrl, stopBed, unlockBedAudio} = await import('../src/lib/audio/bedPlayer.ts');
const waitForFade = () => new Promise(resolve => setTimeout(resolve, 230));

test('uses element volume as a fallback, then routes bed fades through one Web Audio source per element', async () => {
    await startBedUrl('https://example.supabase.co/storage/v1/object/public/bed-tracks/fallback.mp3');
    await waitForFade();

    const fallbackAudio = audioElements.at(-1);
    assert.equal(fallbackAudio.volume, BED_VOLUME);
    assert.equal(sourceNodes.length, 0);
    assert.equal(fallbackAudio.srcAssignments.at(-1).crossOrigin, 'anonymous');

    stopBed();
    await new Promise(resolve => setTimeout(resolve, 330));

    window.AudioContext = FakeAudioContext;
    await unlockBedAudio();
    assert.equal(sourceNodes.length, 1, 'unlock creates the source during the user gesture');

    await startBedUrl('https://example.supabase.co/storage/v1/object/public/bed-tracks/gain.mp3');
    await waitForFade();

    const gainAudio = audioElements.at(-1);
    const gainSource = sourceNodes.at(-1);
    assert.equal(sourceNodes.length, 1, 'starting the unlocked element does not duplicate its source');
    assert.equal(gainSource.audio, gainAudio);
    assert.equal(gainAudio.volume, 1, 'element volume is not also reduced when gain is active');
    assert.equal(gainSource.connectedTo.gain.value, BED_VOLUME);
    assert.equal(gainAudio.srcAssignments.at(-1).crossOrigin, 'anonymous');

    await startBedUrl('https://example.supabase.co/storage/v1/object/public/bed-tracks/replacement.mp3');
    assert.equal(sourceNodes.length, 2, 'the replacement element gets exactly one source');
    assert.equal(gainSource.disconnected, true, 'the replaced element source is detached');

    stopBed();
});
