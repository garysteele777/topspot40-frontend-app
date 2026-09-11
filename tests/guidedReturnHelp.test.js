// @ts-nocheck -- Node test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const panel = readFileSync(
    new URL('../src/lib/components/car/GuidedPlaybackPanel.svelte', import.meta.url),
    'utf8'
);

test('guided return help always displays complete instructions without a stored preference', () => {
    assert.doesNotMatch(panel, /localStorage|sessionStorage|RETURN_HELP_STORAGE_KEY|showDetailedReturnHelp/);
    assert.doesNotMatch(panel, /short reminder|Show step-by-step help/i);
});

test('guided return help contains the exact English core and device-specific copy', () => {
    const panelText = panel.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    for (const copy of [
        'Before you open Spotify',
        'Select “Open this song in Spotify,” then press Play in Spotify.',
        'Listen to this song. When it ends, immediately pause Spotify before the next queued song starts.',
        'Return to this TopSpot40 page and select “Spotify is paused — Continue.”',
        'Important: Spotify may automatically start the next queued song if you do not pause it.',
        'Want to move on early? Pause Spotify and return to TopSpot40 whenever you’re ready to continue.',
        'How to get back to TopSpot40',
        'Tap the Recent Apps button (||| or square), then tap Chrome or TopSpot40.',
        'Swipe up from the bottom and hold, then tap Safari, Chrome, or TopSpot40. On an older iPhone, double-press the Home button.',
        'Pause Spotify, then return to the TopSpot40 browser tab. If the Spotify app opened, select your browser from the Windows taskbar or Mac Dock.'
    ]) {
        assert.ok(panelText.includes(copy));
    }
});

test('guided return help detects and permits manual Android, iPhone, and Computer selection', () => {
    assert.match(panel, /\/iphone\|ipad\|ipod\/\.test\(userAgent\)/);
    assert.match(panel, /\/android\/\.test\(userAgent\)/);
    assert.match(panel, /\['android', 'Android'\]/);
    assert.match(panel, /\['ios', 'iPhone'\]/);
    assert.match(panel, /\['computer', 'Computer'\]/);
    assert.match(panel, /device = value as DeviceType/);
    assert.match(panel, /aria-pressed=\{device === value\}/);
});

test('the Guided Playback report control has its panel-specific English label', () => {
    assert.match(panel, /buttonLabel=\{language === 'en'[\s\S]*'Having trouble\? Report a problem'/);
    assert.equal((panel.match(/<ReportProblemButton/g) ?? []).length, 3);
    assert.equal((panel.match(/Having trouble\? Report a problem/g) ?? []).length, 3);
});

test('only the explicit pre-Spotify button can launch Spotify and the background has no activation handler', () => {
    const preSpotify = panel.slice(
        panel.indexOf('{#if !opened}'),
        panel.indexOf('{:else if returned}')
    );
    const help = panel.slice(
        panel.indexOf('class="return-help pre-spotify-return-help"'),
        panel.indexOf('class="spotify-button"')
    );
    assert.match(help, /on:pointerdown\|stopPropagation/);
    assert.match(help, /on:pointerup\|stopPropagation/);
    assert.match(help, /on:click\|stopPropagation/);
    assert.match(preSpotify, /Open this song in Spotify/);
    assert.equal((preSpotify.match(/on:click=\{openSpotify\}/g) ?? []).length, 1);
    assert.doesNotMatch(panel, /createBroadActivation|primary-spotify-area|on:pointerdown=\{handlePrimaryPointerDown\}|on:keydown=\{handlePrimaryKeydown\}/);
});

test('only the explicit return confirmation advances, while reopen and skip retain their handlers', () => {
    const returned = panel.slice(
        panel.indexOf('{:else if returned}'),
        panel.indexOf('SPOTIFY OPENED')
    );

    assert.match(returned, /Welcome back/);
    assert.match(returned, /Is Spotify paused\?/);
    assert.match(returned, /Pause Spotify before continuing so another song does not play\.\s*You can return at any time—you do not have to finish the song\./);
    assert.match(returned, /Spotify is paused — Continue/);
    assert.equal((returned.match(/on:click=\{onContinue\}/g) ?? []).length, 1);
    assert.match(returned, /Open Spotify Again[\s\S]*on:click=\{openSpotify\}|on:click=\{openSpotify\}[\s\S]*Open Spotify Again/);
    assert.match(returned, /Song did not play — Skip[\s\S]*on:click=\{onSkip\}|on:click=\{onSkip\}[\s\S]*Song did not play — Skip/);
});

test('guided playback state conditions and post-Spotify states remain unchanged', () => {
    assert.match(panel, /\{#if !opened\}/);
    assert.match(panel, /\{:\s*else if returned\}/);
    assert.match(panel, /SPOTIFY OPENED/);
    assert.match(panel, /When it finishes, swipe up and pause,/);
    assert.match(panel, /When it finishes, open Recent Apps/);
    assert.match(panel, /When it finishes, return to this/);
});
