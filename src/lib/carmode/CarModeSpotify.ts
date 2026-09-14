import {writable} from 'svelte/store';
import type {CarModeTrack} from '$lib/carmode/CarMode.store';
import type {Language} from '$lib/stores/selection';
import {logAudioDebug} from '$lib/audio/audioDebug';

export type CarModeSpotifyDependencies = {
    getGuidedReady: () => boolean;
    setStatus: (message: string) => void;
    captureSpotifyOpen?: (track: CarModeTrack) => void;
    getLanguage?: () => Language;
};

export function createCarModeSpotify(
    dependencies: CarModeSpotifyDependencies
) {
    let spotifyWindow: Window | null = null;
    const state = writable({opened: false, returned: false});

    function isMobile(): boolean {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    function reset(): void {
        logAudioDebug('Spotify state reset');
        state.set({opened: false, returned: false});
    }

    function waitingPageUrl(): string {
        const language = dependencies.getLanguage?.() ?? 'en';
        const normalizedLanguage = language === 'ptbr' ? 'pt-BR' : language;
        return `/spotify-wait?language=${normalizedLanguage}`;
    }

    function prepareAutoWindow(): void {
        try {
            if (isMobile()) {
                // Mobile browsers behave better with a normal tab/window.
                // Reserve it now while we're still inside the user's tap.
                spotifyWindow = window.open(
                    waitingPageUrl(),
                    'topspot40-guided-spotify'
                );

                return;
            }

            // Desktop: keep the compact companion popup.
            const width = 390;
            const height = 520;
            const left = Math.max(0, window.screen.availWidth - width - 30);
            const top = 30;

            spotifyWindow = window.open(
                waitingPageUrl(),
                'topspot40-guided-spotify',
                `popup=yes,width=${width},height=${height},left=${left},top=${top}`
            );

            if (spotifyWindow) {
                spotifyWindow.blur();
                window.focus();

                setTimeout(() => {
                    spotifyWindow?.blur();
                    window.focus();
                }, 150);
            }
        } catch {
            spotifyWindow = null;
        }
    }

    function open(track: CarModeTrack | null): boolean {
        logAudioDebug('Spotify open requested', {
            trackRank: track?.rank ?? null,
            trackName: track?.trackName ?? null,
            artistName: track?.artistName ?? null
        });
        if (!track?.spotifyTrackId) {
            logAudioDebug('Spotify open unavailable');
            dependencies.setStatus('Spotify link is not available for this track.');
            return false;
        }

        const activeTrack = track;
        const spotifyUrl = `https://open.spotify.com/track/${activeTrack.spotifyTrackId}`;

        function recordSpotifyOpen(): void {
            state.set({opened: true, returned: false});

            localStorage.setItem(
                'ts-guided-playback-v1',
                JSON.stringify({
                    rankingId: activeTrack.rankingId,
                    rank: activeTrack.rank,
                    spotifyTrackId: activeTrack.spotifyTrackId,
                    trackName: activeTrack.trackName,
                    artistName: activeTrack.artistName,
                    openedAt: new Date().toISOString()
                })
            );

            dependencies.captureSpotifyOpen?.(activeTrack);
        }

        if (isMobile()) {
            logAudioDebug('Spotify mobile navigation selected');
            recordSpotifyOpen();

            // On mobile, use the same browser tab.
            // Android Back should return naturally to Car Mode.
            window.location.href = spotifyUrl;
            return true;
        }

        if (spotifyWindow && !spotifyWindow.closed) {
            logAudioDebug('Spotify existing window reused');
            spotifyWindow.location.href = spotifyUrl;
        } else {
            logAudioDebug('Spotify window created');
            spotifyWindow = window.open(
                spotifyUrl,
                'topspot40-guided-spotify'
            );

            if (!spotifyWindow) {
                logAudioDebug('Spotify popup blocked');
                return false;
            }
        }

        recordSpotifyOpen();
        spotifyWindow.focus();
        return true;
    }

    function close(): boolean {
        const windowToClose = spotifyWindow;
        spotifyWindow = null;

        if (!windowToClose || windowToClose.closed) return true;

        try {
            windowToClose.close();
            return windowToClose.closed;
        } catch {
            // The Spotify window may already have been closed manually or
            // may no longer be accessible.
            return false;
        }
    }

    function returnToWaitingPage(): void {
        try {
            if (spotifyWindow && !spotifyWindow.closed) {
                spotifyWindow.location.href = `${window.location.origin}${waitingPageUrl()}`;
            }
        } catch {
            console.warn('Auto Play: could not return Spotify window to waiting page');
        }
    }

    function handleReturn(): void {
        if (
            !dependencies.getGuidedReady() ||
            document.visibilityState === 'hidden'
        ) {
            logAudioDebug('Spotify return ignored', {
                guidedReady: dependencies.getGuidedReady(),
                pageHidden: document.visibilityState === 'hidden'
            });
            return;
        }

        logAudioDebug('Spotify return accepted');
        state.update(current =>
            current.opened ? {...current, returned: true} : current
        );
    }

    return {
        state,
        isMobile,
        reset,
        prepareAutoWindow,
        open,
        close,
        returnToWaitingPage,
        handleReturn
    };
}
