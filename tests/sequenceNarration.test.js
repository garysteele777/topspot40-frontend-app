// @ts-nocheck -- executed directly by Node's built-in test runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {resolveSequenceNarrationUrls} = await import('../src/lib/audio/sequenceNarration.ts');
const origin = 'https://api.topspot40.com/narration';

function canonicalTrack(rank, language) {
    const bucket = language === 'ptbr' ? 'audio-ptbr' : `audio-${language}`;
    const rankText = String(rank).padStart(2, '0');
    return {
        rank,
        spotifyTrackId: `spotify-${rank}`,
        decadeSlug: '1950s',
        genreSlug: 'tv_themes',
        introUrl: `${origin}/${bucket}/intro/1950s-tv_themes_${rankText}.mp3`,
        detailUrl: `${origin}/${bucket}/detail/spotify-${rank}.mp3`,
        shortDetailUrl: `${origin}/${bucket}/short-detail/spotify-${rank}.mp3`,
        // Deliberately conflicting legacy values prove URL precedence.
        introKey: {bucket, key: `intro/1950s_tv_themes_${rankText}.mp3`}
    };
}

for (const language of ['en', 'es', 'ptbr']) {
    for (const rank of [1, 10, 19]) {
        test(`catalog 63 rank ${rank} ${language} uses all authoritative sequence narration URLs`, () => {
            const track = canonicalTrack(rank, language);
            const urls = resolveSequenceNarrationUrls(track, language, 'long');
            const rankText = String(rank).padStart(2, '0');

            assert.equal(urls.intro, track.introUrl);
            assert.match(urls.intro, new RegExp(`1950s-tv_themes_${rankText}\\.mp3$`));
            assert.doesNotMatch(urls.intro, /1950s_tv_themes/);
            assert.equal(urls.detail, track.detailUrl);
            assert.equal(urls.detailFallback, track.shortDetailUrl);
        });
    }
}

test('legacy sequence fallback uses the canonical decade-genre hyphen separator', () => {
    const urls = resolveSequenceNarrationUrls({
        rank: 1,
        spotifyTrackId: 'spotify-rank-1',
        decadeSlug: '1950s',
        genreSlug: 'tv_themes'
    }, 'en', 'short');

    assert.match(urls.intro, /audio-en\/intro\/1950s-tv_themes_01\.mp3$/);
    assert.doesNotMatch(urls.intro, /1950s_tv_themes/);
    assert.match(urls.detail, /audio-en\/short-detail\/spotify-rank-1\.mp3$/);
    assert.match(urls.detailFallback, /audio-en\/detail\/spotify-rank-1\.mp3$/);
});
