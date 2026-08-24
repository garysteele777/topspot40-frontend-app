import {writable} from 'svelte/store';
import type {CarModeTrack} from '$lib/carmode/CarMode.store';

export type CarModeSpotifyDependencies = {
    getGuidedReady: () => boolean;
    setStatus: (message: string) => void;
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
        state.set({opened: false, returned: false});
    }

    function prepareAutoWindow(): void {
        try {
            if (isMobile()) {
                // Mobile browsers behave better with a normal tab/window.
                // Reserve it now while we're still inside the user's tap.
                spotifyWindow = window.open(
                    '/spotify-wait',
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
                '/spotify-wait',
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

    function open(track: CarModeTrack | null): void {
        if (!track?.spotifyTrackId) {
            dependencies.setStatus('Spotify link is not available for this track.');
            return;
        }

        state.set({opened: true, returned: false});

        localStorage.setItem(
            'ts-guided-playback-v1',
            JSON.stringify({
                rankingId: track.rankingId,
                rank: track.rank,
                spotifyTrackId: track.spotifyTrackId,
                trackName: track.trackName,
                artistName: track.artistName,
                openedAt: new Date().toISOString()
            })
        );

        const spotifyUrl = `https://open.spotify.com/track/${track.spotifyTrackId}`;

        if (isMobile()) {
            // On mobile, use the same browser tab.
            // Android Back should return naturally to Car Mode.
            window.location.href = spotifyUrl;
            return;
        }

        if (spotifyWindow && !spotifyWindow.closed) {
            spotifyWindow.location.href = spotifyUrl;
        } else {
            spotifyWindow = window.open(
                spotifyUrl,
                'topspot40-guided-spotify'
            );
        }

        spotifyWindow?.focus();
    }

    function close(): void {
        try {
            if (spotifyWindow && !spotifyWindow.closed) {
                spotifyWindow.close();
            }
        } catch {
            // The Spotify window may already have been closed manually or
            // may no longer be accessible.
        }

        spotifyWindow = null;
    }

    function returnToWaitingPage(): void {
        try {
            if (spotifyWindow && !spotifyWindow.closed) {
                spotifyWindow.location.href = `${window.location.origin}/spotify-wait`;
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
            return;
        }

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
