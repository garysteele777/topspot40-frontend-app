import { writable } from 'svelte/store';

export type ContextMode =
    | 'info'
    | 'tracks'
    | 'intro'
    | 'detail'
    | 'artist'
    | 'appearances';

export const contextMode = writable<ContextMode>('info');