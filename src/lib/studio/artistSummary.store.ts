// src/lib/studio/artistSummary.store.ts

import { writable } from 'svelte/store';

export interface ArtistSummary {
    artist: {
        artist_id: number;
        artist_name: string;
        artist_description: string;
        artist_artwork: string | null;
    };

    nostalgiaAppearances: {
        program_name: string;
        rank: number;
        track_name: string;
    }[];

    collectionAppearances: {
        program_name: string;
        rank: number;
        track_name: string;
    }[];

    appearanceCount: number;
}

export const artistSummary = writable<ArtistSummary | null>(null);