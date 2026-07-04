import { writable } from 'svelte/store';

export type ContextMode = 'info' | 'tracks';

export const contextMode = writable<ContextMode>('info');