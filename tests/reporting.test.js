// @ts-nocheck -- Svelte components are verified as source contracts in this test suite.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

async function loadContentIssueModule() {
    const source = await read('../src/lib/reporting/contentIssue.ts');
    const compiled = ts.transpileModule(source, {
        compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
    }).outputText;
    const module = {exports: {}};
    new Function('exports', 'module', compiled)(module.exports, module);
    return module.exports;
}

function reportingInput(context = {program: 'favorites'}) {
    return {
        track: {
            id: 'track-42', rankingId: 99, trackName: 'Test Track', artistName: 'Test Artist',
            spotifyTrackId: 'spotify-42', rank: 4,
            intro: 'Narration must never be reported', detail: 'Also excluded', artistText: 'Excluded'
        },
        selection: {mode: 'collection', programType: 'collection', language: 'es', context},
        playbackPhase: 'intro', playbackMode: 'guided', deviceType: 'mobile',
        route: '/car-page', timestamp: '2026-09-01T00:00:00.000Z'
    };
}

test('content issue types contain the eight approved stable values', async () => {
    const {CONTENT_ISSUE_TYPES} = await loadContentIssueModule();
    assert.deepEqual(CONTENT_ISSUE_TYPES, [
        'wrong_spotify_track', 'intro_content', 'detail_content', 'artist_bio_content',
        'audio_narration', 'translation_language', 'playback_controls', 'other'
    ]);
});

test('content issue metadata includes only the approved reporting context', async () => {
    const {buildContentIssueContext} = await loadContentIssueModule();
    const context = buildContentIssueContext(reportingInput());

    assert.deepEqual(Object.keys(context).sort(), [
        'client_timestamp', 'device_type', 'expected_artist_name', 'expected_track_name',
        'experience_mode', 'page_route', 'playback_mode', 'playback_phase', 'program_context',
        'program_type', 'ranking_id', 'selected_language', 'spotify_track_id', 'spotify_url',
        'track_id', 'track_position'
    ]);
    assert.equal(context.spotify_url, 'https://open.spotify.com/track/spotify-42');
    assert.equal(Object.isFrozen(context), true);
});

test('program context is an immutable copied object rather than live selection state', async () => {
    const {buildContentIssueContext} = await loadContentIssueModule();
    const programContext = {program: 'favorites'};
    const context = buildContentIssueContext(reportingInput(programContext));

    assert.deepEqual(context.program_context, {program: 'favorites'});
    assert.notEqual(context.program_context, programContext);
    assert.equal(Object.isFrozen(context.program_context), true);
    programContext.program = 'changed-after-open';
    assert.equal(context.program_context?.program, 'favorites');
});

test('content issue metadata excludes narration, tokens, cookies, and local-storage values', async () => {
    const {buildContentIssueContext} = await loadContentIssueModule();
    const context = buildContentIssueContext(reportingInput({program: 'favorites'}));
    const serialized = JSON.stringify(context).toLowerCase();

    for (const excluded of ['narration must never be reported', 'token', 'cookie', 'localstorage']) {
        assert.doesNotMatch(serialized, new RegExp(excluded));
    }
});

test('feedback entry points send their approved categories', async () => {
    const [contact, landing, feedback] = await Promise.all([
        read('../src/lib/components/profile-components/ContactModal.svelte'),
        read('../src/lib/components/LandingHeader.svelte'),
        read('../src/lib/components/profile-components/FeedbackModal.svelte')
    ]);

    assert.match(contact, /category:\s*'contact'/);
    assert.match(landing, /category:\s*'contact'/);
    assert.match(feedback, /category:\s*'general_feedback'/);
});

test('feedback analytics records successful submissions without user-entered content', async () => {
    const [landing, feedback] = await Promise.all([
        read('../src/lib/components/LandingHeader.svelte'),
        read('../src/lib/components/profile-components/FeedbackModal.svelte')
    ]);

    assert.match(landing, /import posthog from 'posthog-js'/);
    assert.match(feedback, /import posthog from 'posthog-js'/);

    const landingSubmit = landing.indexOf('await submitFeedbackRequest({');
    const landingCapture = landing.indexOf("posthog.capture('feedback_submitted'");
    const feedbackSubmit = feedback.indexOf('await submitFeedbackRequest({');
    const feedbackCapture = feedback.indexOf("posthog.capture('feedback_submitted'");

    assert.ok(landingSubmit >= 0 && landingCapture > landingSubmit);
    assert.ok(feedbackSubmit >= 0 && feedbackCapture > feedbackSubmit);

    assert.match(
        landing,
        /posthog\.capture\('feedback_submitted',\s*\{[\s\S]*?source:\s*'landing_contact',[\s\S]*?category:\s*'contact'/
    );
    assert.match(
        feedback,
        /posthog\.capture\('feedback_submitted',\s*\{[\s\S]*?source:\s*'profile_feedback',[\s\S]*?category:\s*'general_feedback'/
    );

    const landingAnalytics =
        landing.match(/posthog\.capture\('feedback_submitted',\s*\{([\s\S]*?)\}\);/)?.[1] ?? '';
    const feedbackAnalytics =
        feedback.match(/posthog\.capture\('feedback_submitted',\s*\{([\s\S]*?)\}\);/)?.[1] ?? '';

    for (const analyticsPayload of [landingAnalytics, feedbackAnalytics]) {
        assert.doesNotMatch(
            analyticsPayload,
            /\b(message|email|title|route|metadata)\s*:/
        );
    }
});

test('report modal supports multiple localized problem selections and compatible metadata', async () => {
    const [button, modal] = await Promise.all([
        read('../src/lib/components/car/ReportProblemButton.svelte'),
        read('../src/lib/components/car/ReportProblemModal.svelte')
    ]);

    assert.match(modal, /type:\s*'bug',\s*category:\s*'content_issue'/);
    for (const label of ['Report a Problem', 'Informar un problema', 'Informar um problema']) {
        assert.match(button, new RegExp(label));
        assert.match(modal, new RegExp(label));
    }
    for (const legend of [
        'Select all that apply',
        'Seleccione todos los problemas que correspondan',
        'Selecione todos os problemas aplicáveis'
    ]) {
        assert.match(modal, new RegExp(legend));
    }
    assert.match(modal, /type="checkbox"\s+bind:group=\{issues\}/);
    assert.doesNotMatch(modal, /type="radio"/);
    assert.match(modal, /issues\.length === 0 \|\| sending/);
    assert.match(modal, /issues = initialIssueType \? \[initialIssueType\] : \[\];/);
    assert.match(modal, /issue_types:\s*issues/);
    assert.match(modal, /issue_type:\s*issues\[0\]/);
});

test('the car page maps narration modes and owns one shared snapshotted report modal', async () => {
    const page = await read('../src/routes/car-page/+page.svelte');

    assert.match(
        page,
        /mode === 'intro'\s*\?\s*'intro_content'\s*:\s*mode === 'detail'\s*\?\s*'detail_content'\s*:\s*'artist_bio_content'/
    );
    assert.match(page, /reportContext = buildContentIssueContext/);
    assert.equal((page.match(/<ReportProblemModal/g) ?? []).length, 1);
});

test('all car playback surfaces expose the report action', async () => {
    const [classic, driveIn, guided] = await Promise.all([
        read('../src/lib/components/car/CarModePlayerPanel.svelte'),
        read('../src/lib/components/car/DriveInPlayerPanel.svelte'),
        read('../src/lib/components/car/GuidedPlaybackPanel.svelte')
    ]);

    for (const source of [classic, driveIn, guided]) {
        assert.match(source, /<ReportProblemButton/);
        assert.match(source, /onReport=\{\(\) => onReportProblem\?\.\(\)\}/);
    }
    assert.match(classic, /onReport=\{\(mode\) => onReportNarration\?\.\(mode\)\}/);
    assert.match(driveIn, /onReport=\{\(mode\) => onReportNarration\?\.\(mode\)\}/);
    assert.match(driveIn, /class="drive-in-report-slot"[\s\S]*?<ReportProblemButton/);
    assert.doesNotMatch(driveIn, /drive-in-report-slot\s*\{[\s\S]*position:\s*absolute/);
});

test('the guided report button isolates broad activation pointer and click events', async () => {
    const button = await read('../src/lib/components/car/ReportProblemButton.svelte');

    assert.match(button, /on:pointerdown\|stopPropagation/);
    assert.match(button, /on:pointerup\|stopPropagation/);
    assert.match(button, /on:click\|stopPropagation=\{onReport\}/);
});

test('report dialog retains accessible close, focus, error, and optional-email behavior', async () => {
    const modal = await read('../src/lib/components/car/ReportProblemModal.svelte');

    assert.match(modal, /role="dialog"/);
    assert.match(modal, /aria-labelledby="report-problem-title"/);
    assert.match(modal, /aria-describedby="report-problem-help report-problem-error"/);
    assert.match(modal, /event\.key === 'Escape'/);
    assert.match(modal, /function trapFocus/);
    assert.match(modal, /previousFocus\?\.focus\(\)/);
    assert.match(modal, /function lockBodyScroll/);
    assert.match(modal, /function restoreBodyScroll/);
    assert.match(modal, /onDestroy\(restoreBodyScroll\)/);
    assert.match(modal, /aria-live="assertive"/);
    assert.match(modal, /function isValidOptionalEmail/);
    assert.match(modal, /error = t\.invalidEmail;/);
    assert.match(modal, /on:click\|stopPropagation/);
    assert.match(modal, /<fieldset>/);
    assert.match(modal, /<legend>\{t\.selectAllThatApply\}<\/legend>/);
    assert.match(modal, /class:choice-selected=\{issues\.includes\(value\)\}/);
    assert.match(modal, /fieldset\s*\{[\s\S]*gap: 0;[\s\S]*padding: 0;[\s\S]*border: 0;/);
    assert.match(modal, /\.choice\s*\{[\s\S]*box-sizing: border-box;[\s\S]*min-height: 56px;[\s\S]*border: 0;[\s\S]*border-bottom: 1px solid #ffffff24;/);
    assert.match(modal, /\.choice:last-of-type\s*\{[\s\S]*border-bottom: 0;/);
    assert.match(modal, /\.choice-selected\s*\{[\s\S]*background: #d7b85b26;/);
    assert.match(modal, /\.choice:focus-within\s*\{[\s\S]*outline: 3px solid #d7b85b;/);
    assert.match(modal, /\.actions button:disabled\s*\{[\s\S]*background: #5e5e5e;[\s\S]*color: #f5f5f5;[\s\S]*cursor: not-allowed;/);
});

test('report dialog resets all selections and keeps form controls usable at available width', async () => {
    const modal = await read('../src/lib/components/car/ReportProblemModal.svelte');

    assert.match(modal, /let issues: ContentIssueType\[\] = \[\];/);
    assert.match(modal, /issues = initialIssueType \? \[initialIssueType\] : \[\];/);
    assert.match(modal, /box-sizing: border-box;/);
    assert.match(modal, /textarea,\s*input\s*\{[\s\S]*width: 100%;/);
    assert.match(modal, /\.email-hint\s*\{[\s\S]*margin: 6px 0 20px;/);
    assert.match(modal, /max-height: 90vh;[\s\S]*overflow: auto;/);
});
