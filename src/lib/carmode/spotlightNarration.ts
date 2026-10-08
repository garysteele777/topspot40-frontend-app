import type {CarModeNarrationEntry} from './CarModeNarration';

// Spotlight's biography choice is independent of optional artist stories
// in other program modes, and always precedes track narration.
export function withSpotlightBio(
    entries: CarModeNarrationEntry[],
    bioUrl: string | null,
    alreadyPlayed: boolean
): CarModeNarrationEntry[] {
    return bioUrl && !alreadyPlayed
        ? [{phase: 'artist', url: bioUrl}, ...entries]
        : entries;
}

export function spotlightStoryUrl(story: {
    has_story?: boolean;
    tts_bucket?: string;
    tts_key?: string;
}): string | null {
    if (!story.has_story || !story.tts_bucket || !story.tts_key) return null;
    const key = story.tts_key.startsWith(`${story.tts_bucket}/`)
        ? story.tts_key.slice(story.tts_bucket.length + 1)
        : story.tts_key;
    return 'https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/' +
        `${encodeURIComponent(story.tts_bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
}
