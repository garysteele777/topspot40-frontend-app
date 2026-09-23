# TopSpot40 Frontend Project Context

This file summarizes the currently verified frontend implementation. Current code, configuration, package scripts, Git state, and command output remain the source of truth.

## Purpose and Responsibilities

`topspot40-frontend-app` is the SvelteKit frontend for TopSpot40.

Verified responsibilities include:

- Landing pages.
- The active listening control panel.
- Sign-in redirects to the backend's currently implemented Spotify OAuth flow.
- Subscription checkout UI and dashboard shell.
- Static catalog access.
- Car-mode playback UI.
- Guided Spotify link-out playback.
- Journey-prototype route flow.
- Local favorites and program history.
- Browser-side audio behavior.
- PWA registration.

Evidence includes `src/routes/+page.svelte`, `src/routes/options-v4/+page.svelte`, `src/routes/car-page/+page.svelte`, `src/lib/carmode/*`, and `static/catalog/**`.

## Technology and Verified Package Scripts

The app uses SvelteKit 2, Svelte 5, Vite, TypeScript strict mode, npm, Netlify adapter, and Lucide icon packages.

Evidence includes:

- `package.json`
- `package-lock.json`
- `svelte.config.js`
- `vite.config.ts`
- `tsconfig.json`

Verified package dependencies include `@sveltejs/kit`, `svelte`, `vite`, `typescript`, `svelte-check`, `@sveltejs/adapter-netlify`, `@sveltejs/adapter-auto`, `@sveltejs/vite-plugin-svelte`, `cross-env`, `@lucide/svelte`, and `lucide-svelte`.

`@sveltejs/adapter-netlify` is the configured adapter in `svelte.config.js`.

Verified scripts in `package.json` are:

- `dev`
- `dev:local`
- `dev:render`
- `build`
- `preview`
- `prepare`
- `check`
- `check:watch`

`npm run check` runs `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`.

`dev:local` sets `VITE_API_BASE_URL=http://127.0.0.1:8000` and `VITE_PLAYBACK_POLL_MS=250`.

`dev:render` sets `VITE_API_BASE_URL=https://api.topspot40.com` and `VITE_PLAYBACK_POLL_MS=500`.

## SvelteKit Entrypoints and Active Routes

Frontend entrypoints include:

- `src/app.html`
- `src/app.d.ts`
- `src/routes/+layout.svelte`

`src/routes/+layout.svelte` renders `LandingHeader` only on `/`, registers `/sw.js`, captures `beforeinstallprompt`, and logs `VITE_API_BASE_URL`.

`src/app.html` links `/manifest.webmanifest`, favicons, Apple touch icon, and theme color.

Active routes are:

- `/`: language landing page, stores `topspot_language` and `tts_language`, defaults to `/journey-prototype` unless `topspot_home_layout === 'compact'`, and in compact mode links to `/catalog/index.html` and `/options-v4`; see `src/routes/+page.svelte`.
- `/about`: placeholder page; see `src/routes/about/+page.svelte`.
- `/landing-classic`: legacy marketing page with image carousels and a temporary options button; see `src/routes/landing-classic/+page.svelte`.
- `/signin`: Spotify OAuth redirect; see `src/routes/signin/+page.svelte`.
- `/signup-official`: Spotify OAuth redirect; see `src/routes/signup-official/+page.svelte`.
- `/create-account`: subscription gate and checkout UI; see `src/routes/create-account/+layout.server.ts` and `src/routes/create-account/+page.svelte`.
- `/success`: Stripe verification redirect flow; see `src/routes/success/+page.svelte`.
- `/dashboard`: subscription-protected dashboard shell; see `src/routes/dashboard/+layout.server.ts` and `src/routes/dashboard/+page.svelte`.
- `/options-v4`: active control panel; see `src/routes/options-v4/+page.svelte`.
- `/journey-prototype`: selects language and journey/list view; see `src/routes/journey-prototype/+page.svelte`.
- `/journey-prototype/choose`: selects journey destination; see `src/routes/journey-prototype/choose/+page.svelte`.
- `/journey-prototype/decade`: selects decade; see `src/routes/journey-prototype/decade/+page.svelte`.
- `/journey-prototype/genre`: selects genre and launches `/car-page` with `mode=nostalgia`, selected decade/genre, current language, shuffle order, before-voice mode, continuous pause mode, and `skipPlayed=false`; see `src/routes/journey-prototype/genre/+page.svelte`.
- `/car-page`: client-only playback UI; see `src/routes/car-page/+page.ts` and `src/routes/car-page/+page.svelte`.
- `/not-spotify-premium`: Spotify Premium requirement page; see `src/routes/not-spotify-premium/+page.svelte`.
- `/program`: program history/detail view; see `src/routes/program/+page.svelte`.
- `/story-player`: artist/docuseries story player supporting `type=artist_story` and `type=music_docuseries`; see `src/routes/story-player/+page.svelte`.

## Major Components, Stores, API Helpers, Audio, and Playback Areas

Landing, header, and profile UI includes:

- `src/lib/components/Header.svelte`
- `src/lib/components/LandingHeader.svelte`
- `src/lib/components/DropdownMenu.svelte`
- `src/lib/components/profile-components/*`

Car-mode UI includes `src/lib/components/car/*`.

Options/control-panel UI includes:

- `src/lib/components/options-v2/*`
- `src/lib/components/options/*`

Reusable playback/audio UI includes:

- `src/lib/components/MiniPlayer.svelte`
- `src/lib/components/SeekSlider.svelte`
- `src/lib/components/ui/EarButton.svelte`

Stores include:

- `src/lib/stores/selection.ts`
- `src/lib/carmode/CarMode.store.ts`
- `src/lib/stores/playbackSettings.store.ts`
- `src/lib/stores/catalogStore.ts`
- `src/lib/carmode/programHistory.ts`
- `src/lib/favorites/favorites.ts`

Catalog and sequence helpers include:

- `src/lib/api/catalog.ts`
- `src/lib/stores/loadCatalogOnce.ts`
- `src/lib/helpers/normalizeCatalog.ts`
- `src/lib/api/supabaseLoader.ts`
- `src/lib/helpers/trackSequenceLoader.ts`
- `src/lib/utils/normalizeTrack.ts`

URL and resume helpers include:

- `src/lib/helpers/car/selectionFromUrl.ts`
- `src/lib/utils/buildLaunchUrl.ts`
- `src/lib/utils/smartResume.ts`

Playback and browser-audio areas include:

- `src/lib/api/playbackApi.ts`
- `src/lib/carmode/startPlayback.ts`
- `src/lib/carmode/CarMode.loader.ts`
- `src/lib/carmode/CarMode.poller.ts`
- `src/lib/audio/bedPlayer.ts`
- `src/lib/audio/narrationPlayer.ts`

`src/routes/story-player/+page.svelte` posts to `/artist-spotlight/play-artist-story?artist_id=...&language=...` for artist stories and `/music-docuseries/play?slug=...&language=...` for music docuseries. It creates browser `Audio` for narration, optionally creates looping bed audio from returned bucket/key values, supports play, pause, resume, and stop, returns docuseries users to `/options-v4?panel=library&tab=collections&collection_group=music_docuseries...`, and shows an external YouTube documentary link when `has_youtube_video` and `youtube_url` are present.

## Backend URL and Request Patterns

There are two active backend URL patterns.

`src/lib/config.ts::getBackendUrl()` chooses `http://127.0.0.1:8000` on localhost or `127.0.0.1`, and `https://api.topspot40.com` otherwise. It does not use `VITE_API_BASE_URL`.

Many client modules use `import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'` directly, including:

- `src/lib/api/playbackApi.ts`
- `src/lib/api/catalog.ts`
- `src/lib/api/supabaseLoader.ts`
- `src/lib/api/preview.ts`
- `src/routes/car-page/+page.svelte`
- `src/routes/story-player/+page.svelte`
- `src/lib/carmode/startPlayback.ts`
- `src/lib/carmode/CarMode.poller.ts`
- `src/lib/audio/bedPlayer.ts`

Catalog requests in `src/lib/api/catalog.ts::fetchGroupedCatalog` and `src/lib/api/catalog.ts::loadCatalogSummary` use `credentials: 'omit'`.

Authenticated playback and subscription requests generally use `credentials: 'include'`.

## Authentication, Cookies, and Subscription Flow

Spotify OAuth is initiated by frontend redirect only.

Verified callers:

- `src/routes/signin/+page.svelte::signInWithSpotify`
- `src/routes/signup-official/+page.svelte::signInWithSpotify`

Both redirect to `${getBackendUrl()}/api/auth/spotify/login`.

Subscription status is checked through `/api/subscription-status` with cookies included.

Verified callers:

- `src/routes/create-account/+layout.server.ts::load`
- `src/routes/dashboard/+layout.server.ts::load`

Checkout starts with `POST /api/create-checkout-session` and cookies included. Evidence: `src/routes/create-account/+page.svelte::startCheckout`.

Payment verification calls `GET /api/verify-subscription?session_id={session_id}` with cookies included. Evidence: `src/routes/success/+page.svelte`.

The inspected active frontend code does not parse or store Spotify access tokens.

## Playback, Polling, and Browser Audio Architecture

`/car-page` disables SSR and prerendering in `src/routes/car-page/+page.ts`.

Car-mode UI state lives in `src/lib/carmode/CarMode.store.ts`. Verified state fields include `currentSelection`, `tracks`, `currentTrack`, `currentRank`, `status`, `playbackPhase`, `elapsed`, `duration`, `progress`, `isPlaying`, `showNarrationModal`, and `timingSource`.

`src/lib/carmode/CarMode.loader.ts::loadForSelection` loads tracks or radio placeholders based on selection mode/program type. It handles decade/genre, collection, collection radio, artist spotlight, artist radio, and favorites paths.

`src/lib/carmode/CarMode.poller.ts::startPlaybackPolling` polls `/playback/status`, updates UI state, runs browser narration audio, starts/stops bed audio, starts Spotify tracks, and dispatches `ts-next-track` for continuous mode.

Polling interval is controlled by `VITE_PLAYBACK_POLL_MS ?? 500` in `src/lib/carmode/CarMode.poller.ts`.

Backend status is fetched by `src/lib/api/playbackApi.ts::fetchPlaybackStatus`.

Automatic playback uses backend reset plus `src/lib/carmode/CarMode.poller.ts::startPlaybackPolling`.

Guided playback does not start polling on mount. `src/routes/car-page/+page.svelte` owns guided narration and bed audio in the browser, then opens Spotify with `window.open('https://open.spotify.com/track/{spotifyTrackId}', 'topspot40-guided-spotify')`. Guided flow tracks `guidedReady`, `guidedSpotifyOpened`, and `guidedSpotifyReturned`, closes the Spotify window on continue, skip, or back when possible, and advances with `nextTrack()`.

Browser narration and bed audio are handled in `src/lib/carmode/CarMode.poller.ts`, `src/lib/audio/bedPlayer.ts`, and guided playback code in `src/routes/car-page/+page.svelte`.

Guided `/car-page` narration chooses `short-detail` or `detail` audio based on `playbackSettingsStore.detailLength`, uses the other folder as fallback, starts bed audio before narration, stops bed audio after narration, and marks the UI ready for Spotify link-out. Guided pause cancels the current run, stops narration and bed audio, and sets phase to `paused`.

Spotify device transfer/play calls are frontend-triggered during automatic normal track phase through functions called by `src/lib/carmode/CarMode.poller.ts`. Guided playback opens Spotify track URLs in a browser window instead of using the poller to start Spotify playback.

`src/lib/audio/narrationPlayer.ts` exists as a smaller standalone narration helper, but the active car-mode poller has its own narration flow.

## Browser Storage

Verified browser-storage keys include:

- `topspot_language`: `src/routes/+page.svelte`
- `tts_language`: `src/routes/+page.svelte`
- `topspot_detail_length`: `src/lib/stores/playbackSettings.store.ts`
- `topspot_home_layout`: `src/routes/+page.svelte`
- `topspot_journey_view`: `src/routes/journey-prototype/+page.svelte`
- `topspot_journey_destination`: `src/routes/journey-prototype/choose/+page.svelte`
- `topspot_journey_decade`: `src/routes/journey-prototype/decade/+page.svelte`
- `topspot_journey_genre`: `src/routes/journey-prototype/genre/+page.svelte`
- `ts_selection`: `src/lib/stores/selection.ts`
- `ts_last_selection`: `src/lib/carmode/CarMode.store.ts`
- `ts-guided-playback-v1`: `src/routes/car-page/+page.svelte`
- `ts_program_history_v1`: `src/lib/carmode/programHistory.ts`
- `ts-favorites-v1`: `src/lib/favorites/favorites.ts`
- `topspot_catalog`: `src/lib/stores/loadCatalogOnce.ts`
- `topspot_last_selection`: `src/lib/utils/smartResume.ts`
- `ts-debug`: `src/lib/carmode/CarMode.poller.ts`
- `ts_last_reset`: `src/lib/utils/dailyReset.ts`

`src/lib/stores/playbackSettings.store.ts` defaults to guided playback, shuffle, skip played, continuous pause mode, intro and detail voices, before-voice mode, and persists only `detailLength` to `topspot_detail_length`.

`VITE_CONFIRM_CLEAR` is read by `src/lib/utils/confirm.ts::confirmClear`, though active code also uses direct `window.confirm` calls.

## PWA and Service-Worker Implementation

`src/app.html` links `/manifest.webmanifest`.

`src/routes/+layout.svelte` registers `/sw.js` and captures `beforeinstallprompt`.

`static/sw.js` calls `self.skipWaiting()` on install and `self.clients.claim()` on activate. It does not implement a caching strategy.

`static/manifest.webmanifest` names TopSpot40 and references `/icons/icon-192.png` and `/icons/icon-512.png`.

`static/site.webmanifest` also exists but is not linked by `src/app.html`.

## Static Catalog and Assets

The app serves a large tracked static catalog under `static/catalog`.

`src/routes/+page.svelte::discover` links directly to `/catalog/index.html` when the compact home layout is active.

Verified catalog structure includes top-level catalog HTML files plus `artists`, `nostalgia`, `collections`, `collection-groups`, and `assets` subdirectories.

Other public assets include app icons, screenshots, `default_album.png`, docuseries logo, music photos, listening photos, and vinyl photos.

## Current Testing and Quality-Tooling Status

No verified unit test, component test, end-to-end test, lint, format, accessibility, Playwright, or Vitest tooling exists in the current frontend repository.

No frontend check, build, test, lint, format, browser, accessibility, or PWA validation command was run during the read-only audit.

`npm run check` is a Svelte and TypeScript check. It is not a substitute for tests, linting, accessibility testing, browser verification, or PWA validation.

## Deployment Facts That Are Actually Verified

`@sveltejs/adapter-netlify` is configured in `svelte.config.js`.

No `netlify.toml`, `vercel.json`, `render.yaml`, Dockerfile, or GitHub deployment workflow was found in the frontend root scan.

`src/lib/config.ts::FRONTEND_URL` hardcodes production frontend as `https://resplendent-gaufre-032b1a.netlify.app`.

Backend CORS in `topspot-backend-api/backend/main.py` includes `https://topspot40.com`, `https://www.topspot40.com`, `https://topspot40.netlify.app`, `https://sparkling-croissant-23bbac.netlify.app`, and `https://resplendent-gaufre-032b1a.netlify.app`.

## Cross-Repository Contracts

The audit identified frontend callers for backend routes covering authentication, subscriptions, catalog, playback, Supabase-backed sequences, artist spotlight, and music docuseries.

Verified frontend-side callers include:

- `/api/auth/spotify/login`
- `/api/auth/me`
- `/api/subscription-status`
- `/api/create-checkout-session`
- `/api/verify-subscription`
- `/api/catalog/grouped`
- `/api/catalog/summary`
- `/playback/status`
- `/playback/reset`
- `/playback/play-track`
- `/playback/stop`
- `/playback/pause`
- `/playback/resume`
- `/playback/devices`
- `/playback/transfer/{device_id}`
- `/playback/play-spotify`
- `/playback/narration-finished`
- `/playback/track-finished`
- `/playback/client-diagnostic`
- `/supabase/decade-genre/get-sequence`
- `/supabase/decade-genre/play-first`
- `/supabase/decade-genre/play-sequence`
- `/supabase/decade-genre/get-favorites`
- `/supabase/collections/get-sequence`
- `/supabase/collections/play-collection-sequence`
- `/artist-spotlight/*`
- `/music-docuseries/*`

Backend route existence was verified read-only through `topspot-backend-api/backend/main.py` router registration and route files including `backend/isaiah/isaiah_router.py`, `backend/routers/catalog.py`, `backend/routers/playback_status.py`, `backend/routers/playback_control.py`, `backend/routers/decade_genre_player.py`, `backend/routers/collections_player.py`, `backend/routers/supabase_collections.py`, `backend/routers/artist_spotlight.py`, and `backend/routers/music_docuseries.py`.

Response-shape compatibility was not exhaustively audited.

## Retired or Inactive Areas

The former retired `/options-v2` and `/options-v3` route artifacts have been removed; active options controls are documented under `src/lib/components/options-v2/*`.

## Known Inconsistencies Requiring Resolution

`src/lib/utils/buildLaunchUrl.ts` can generate `/list-page`, but no active `src/routes/list-page` exists.

`src/routes/landing-classic/+page.svelte` links `/app` and `/demo`, but no active routes were found for those paths.

`src/routes/story-player/+page.svelte` checks `pt-BR` for `youtubeButtonLabel`, while other active language code uses `ptbr`.

`src/lib/helpers/catalogLoader.ts::loadCatalog` fetches `/api/supabase/grouped-catalog`; that route was not found in backend route search. The active options flow appears to use `src/lib/stores/loadCatalogOnce.ts` and `/api/catalog/grouped`.

Production frontend URL values differ in verified code. Backend helper code uses `https://topspot40.com`, while frontend `src/lib/config.ts::FRONTEND_URL` uses `https://resplendent-gaufre-032b1a.netlify.app`.

Frontend backend URL selection is inconsistent. `src/lib/config.ts::getBackendUrl()` ignores `VITE_API_BASE_URL`, while many API modules use `import.meta.env.VITE_API_BASE_URL`.

Some comments and text contain garbled character encoding artifacts.

## Known Limitations and Unresolved Facts

No dependencies were installed, no dev server was started, and no browser verification was performed during the read-only audit.

No build, check, test, lint, format, accessibility, responsive, PWA, authentication, playback, Stripe, Spotify, or external-service behavior was exercised during the read-only audit.

Response-shape compatibility with backend routes was not exhaustively audited.

No frontend deployment config beyond `svelte.config.js` was verified.

Spotify is the currently implemented playback integration. This document does not establish Spotify as TopSpot40's approved long-term playback provider or confirm that the current integration can support production-scale usage.
