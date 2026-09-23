// @ts-nocheck -- verifies the Drive-In stationary-label localization contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {
    classicViewCopy,
    formatDriveInTrackPosition
} = await import('../src/lib/carmode/classicViewLabels.ts');

const expected = {
    en: {
        carMode: 'CAR MODE', nowPlaying: 'NOW PLAYING', track: 'Track',
        carView: 'Car View', driveInView: 'Drive-In View', playbackView: 'Playback view',
        position: 'Track 38 of 45'
    },
    es: {
        carMode: 'MODO AUTO', nowPlaying: 'AHORA SUENA', track: 'Canción',
        carView: 'Vista del auto', driveInView: 'Vista autocine', playbackView: 'Vista de reproducción',
        position: 'Canción 38 de 45'
    },
    ptbr: {
        carMode: 'MODO CARRO', nowPlaying: 'TOCANDO AGORA', track: 'Faixa',
        carView: 'Vista do carro', driveInView: 'Vista drive-in', playbackView: 'Visualização de reprodução',
        position: 'Faixa 38 de 45'
    }
};

for (const [language, copy] of Object.entries(expected)) {
    test(`Drive-In stationary labels have approved ${language} copy`, () => {
        for (const key of ['carMode', 'nowPlaying', 'track', 'carView', 'driveInView', 'playbackView']) {
            assert.equal(classicViewCopy[language][key], copy[key]);
        }
        assert.equal(formatDriveInTrackPosition(38, 45, language), copy.position);
    });
}
