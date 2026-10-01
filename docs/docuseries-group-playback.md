# Docuseries group playback

Play Unheard uses shared, language-independent completion and keeps the group's
numbered order. Play All uses every story in numbered order and starts with a
group introduction. Both stop at the end. A new visit begins at time zero;
Pause/Resume only retains the position during the current session.

Completion requires 90% of the actual narration's unique played ranges, using
the browser's media duration. Seeking or repeating a short section does not
count as completing the story. The introduction does not count toward history.
History uses browser storage, like the existing Nostalgia and Collections
history. It does not sync across phones, computers, or browser profiles.

## Generate the introductions before release

Scripts for 14 groups in EN, ES and PT-BR are in
`scripts/docuseries-group-intros.json`. Use the Python environment already
configured for `topspot-backend-api` and its existing ElevenLabs credentials:

```bash
python scripts/generate_docuseries_group_intros.py --backend-root ../topspot-backend-api --language all --dry-run
python scripts/generate_docuseries_group_intros.py --backend-root ../topspot-backend-api --language all
```

The first command plans 42 recordings without using TTS credits. The second
uses the configured artist-story voices and models and writes verified MP3s
under `static/docuseries/group-intros/{language}/{collection_slug}.mp3`.
Existing valid recordings are skipped; `--group legends_rivalries` can be used
for a first sample. Generated MP3s must be included in the frontend release.
There are no database migrations or Supabase uploads. If an introduction cannot
load, group playback continues with the first story.

## Acceptance checks

- Check badges and shared history after EN, ES and PT-BR playback and reload.
- Complete 90% of one story and stop: it is complete on all entry points.
- Stop below 90%: it remains unheard and starts at the beginning next visit.
- Play Unheard skips only completed stories and stops after the last remaining story.
- Play All plays one introduction, every story in sequence, then stops.
- Next during the introduction starts story 1; Next during a story does not
  mark the skipped story complete unless 90% was actually heard.
- Test Stop and Pause during loading, failed narration, missing intro, and
  navigation away. Narration and bed must both stop when leaving the player.
- Verify on actual Android and iPhone devices with locked screens, car Bluetooth,
  headset controls, and incoming calls. Desktop browser tests do not establish
  reliable mobile background playback.
