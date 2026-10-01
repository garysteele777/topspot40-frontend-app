"""Generate the group's welcome recordings using TopSpot40's existing voices.

Run from the frontend repository, using the Python environment already set up
for topspot-backend-api. No database or Supabase writes are needed.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import tempfile
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend-root', type=Path, default=Path('../topspot-backend-api'))
    parser.add_argument('--language', choices=['all', 'en', 'es', 'ptbr'], default='all')
    parser.add_argument('--group', help='Generate only this collection slug')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--overwrite', action='store_true')
    args = parser.parse_args()
    frontend = Path(__file__).resolve().parents[1]
    scripts = json.loads((frontend / 'scripts/docuseries-group-intros.json').read_text(encoding='utf-8'))
    if args.group and args.group not in scripts:
        parser.error('Unknown group slug')
    jobs = [(slug, lang, script) for slug, versions in scripts.items()
            for lang, script in versions.items()
            if (not args.group or slug == args.group) and (args.language == 'all' or lang == args.language)]
    if args.dry_run:
        for slug, language, script in jobs:
            print(f'{language}/{slug}: {len(script)} characters')
        print(f'{len(jobs)} recordings planned. No TTS credits used.')
        return

    sys.path.insert(0, str(args.backend_root.resolve()))
    from backend.config.tts_config import TTS_PROFILES, MODEL_BY_LANG
    from backend.services.tts.elevenlabs_tts import generate_tts_mp3
    from mutagen.mp3 import MP3

    output = frontend / 'static/docuseries/group-intros'
    generated = skipped = 0
    for slug, language, script in jobs:
        target = output / language / f'{slug}.mp3'
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and not args.overwrite:
            duration = float(MP3(target).info.length)
            if not math.isfinite(duration) or duration <= 0:
                raise RuntimeError(f'Invalid existing recording: {target}')
            skipped += 1
            continue
        profile_language = 'pt-BR' if language == 'ptbr' else language
        profile = TTS_PROFILES[profile_language]['artist_story']
        with tempfile.TemporaryDirectory(dir=target.parent) as temp:
            recording = Path(temp) / 'intro.mp3'
            generate_tts_mp3(text=script, out_path=recording, voice_id=profile['voice_id'],
                             settings=profile.get('settings'), model_id=MODEL_BY_LANG.get(profile_language),
                             language=profile_language, overwrite=True)
            duration = float(MP3(recording).info.length)
            if not math.isfinite(duration) or duration <= 0:
                raise RuntimeError(f'Generated recording has no valid duration: {slug}/{language}')
            recording.replace(target)
        generated += 1
        print(f'Generated {language}/{slug}: {duration:.1f} seconds')
    print(f'Generated: {generated}. Existing recordings skipped: {skipped}.')


if __name__ == '__main__':
    main()
