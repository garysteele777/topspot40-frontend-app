// src/lib/stores/top40playlist.ts
// tracks/metadata from BACKEND
import { writable } from 'svelte/store';

export type Track = {
	track_name: string;
	album_name: string;
	album_artwork: string;
	artist_name: string;
	featured_artist: string;
	artist_display_name: string;
	artist_artwork: string;
	artist_description: string;
	rank: number;
	decade_name: string;
	genre_name: string;
	year_released: number;
	mode_flag?: string;
	duration_ms: number;
	track_preview: string;
	spotify_track_id: string;
	spotify_artist_id: string;
	featured_artist_id: string;
	intro_mp3_url?: string;
	detail_mp3_url?: string;
	track_intro: string;
	track_detail: string;
	language?: string;
}; // mp3 url from backend

export const playlistStore = writable<Track[]>([]);
