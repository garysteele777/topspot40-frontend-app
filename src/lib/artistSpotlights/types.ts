import type {Language} from '$lib/types/playback';

export type ArtistSpotlightCategory = 'featured' | 'other' | 'single';

export const ARTIST_ALPHABET_RANGES = [
    'A-B',
    'C-D',
    'E-G',
    'H-J',
    'K-M',
    'N-P',
    'Q-S',
    'T-V',
    'W-Z'
] as const;

export type ArtistAlphabetRange = typeof ARTIST_ALPHABET_RANGES[number];

export type ArtistGenreOption = {
    id: string;
    label: string;
};

export type ArtistSpotlightItem = {
    artist_id: number;
    artist_name: string;
    genre_track_count: number;
    total_track_count: number;
    has_story: boolean;
    artist_artwork?: string | null;
    artwork_url?: string | null;
};

export type ArtistStoryInfo = {
    ok: boolean;
    has_story: boolean;
    story_id?: number;
    artist_id?: number;
    artist_name?: string;
    title?: string;
    story_type?: string;
    duration_seconds?: number;
    tts_bucket?: string;
    tts_key?: string;
    artist_artwork?: string | null;
    has_youtube_video?: boolean;
    youtube_video_id?: string;
    youtube_url?: string;
};

export type ArtistTrackItem = {
    track_id: number;
    track_name: string;
    spotify_track_id: string;
    duration_ms: number;
    artist_id: number;
    artist_name: string;
    spotify_artist_id?: string | null;
    album_artwork?: string | null;
    album_name?: string | null;
    year_released?: number | null;
    detail?: string | null;
    artist_description?: string | null;
};

export type ArtistSpotlightBrowserState = {
    category: ArtistSpotlightCategory;
    range: ArtistAlphabetRange;
    genre: string;
};

export type ArtistSpotlightLaunchSettings = {
    artistId: number;
    artistName: string;
    genre: string;
    language: Language;
    returnTo?: string;
};
