<script lang="ts">
    import {onDestroy, onMount, tick} from 'svelte';
    import {submitFeedback} from '$lib/api/feedback';
    import {
        CONTENT_ISSUE_TYPES,
        type ContentIssueContext,
        type ContentIssueType
    } from '$lib/reporting/contentIssue';

    type Locale = 'en' | 'es' | 'ptbr';
    type ModalCopy = {
        title: string;
        selectAllThatApply: string;
        details: string;
        email: string;
        emailHint: string;
        invalidEmail: string;
        send: string;
        sending: string;
        success: string;
        close: string;
        error: string;
        none: string;
    };

    export let open = false;
    export let context: ContentIssueContext | null = null;
    export let language = 'en';
    export let initialIssueType: ContentIssueType | undefined;
    export let onClose: () => void;

    const copy: Record<Locale, ModalCopy> = {
        en: {
            title: 'Report a Problem',
            selectAllThatApply: 'Select all that apply',
            details: 'Additional details (optional)',
            email: 'Email (only if you would like a reply)',
            emailHint: 'We only use this email to reply about your report.',
            invalidEmail: 'Enter a valid email address or leave the field blank.',
            send: 'Send report',
            sending: 'Sending…',
            success: 'Thank you. Your report has been sent.',
            close: 'Close',
            error: 'We could not send your report. Please try again.',
            none: 'No additional details provided.'
        },
        es: {
            title: 'Informar un problema',
            selectAllThatApply: 'Seleccione todos los problemas que correspondan',
            details: 'Detalles adicionales (opcional)',
            email: 'Correo electrónico (solo si desea una respuesta)',
            emailHint: 'Solo usaremos este correo para responder sobre su informe.',
            invalidEmail: 'Ingrese un correo electrónico válido o deje el campo en blanco.',
            send: 'Enviar informe',
            sending: 'Enviando…',
            success: 'Gracias. Su informe fue enviado.',
            close: 'Cerrar',
            error: 'No pudimos enviar su informe. Inténtelo de nuevo.',
            none: 'No se proporcionaron detalles adicionales.'
        },
        ptbr: {
            title: 'Informar um problema',
            selectAllThatApply: 'Selecione todos os problemas aplicáveis',
            details: 'Detalhes adicionais (opcional)',
            email: 'E-mail (somente se quiser uma resposta)',
            emailHint: 'Usaremos este e-mail somente para responder sobre seu relato.',
            invalidEmail: 'Digite um e-mail válido ou deixe o campo em branco.',
            send: 'Enviar relatório',
            sending: 'Enviando…',
            success: 'Obrigado. Seu relatório foi enviado.',
            close: 'Fechar',
            error: 'Não foi possível enviar seu relatório. Tente novamente.',
            none: 'Nenhum detalhe adicional informado.'
        }
    };

    const issueLabels: Record<Locale, Record<ContentIssueType, string>> = {
        en: {
            wrong_spotify_track: 'Wrong song or recording opened in Spotify',
            intro_content: 'Song introduction is incorrect',
            detail_content: 'Track details are incorrect',
            artist_bio_content: 'Artist biography is incorrect',
            audio_narration: 'Audio or narration problem',
            translation_language: 'Translation or language problem',
            playback_controls: 'Playback or button problem',
            other: 'Something else'
        },
        es: {
            wrong_spotify_track: 'Se abrió una canción o grabación incorrecta en Spotify',
            intro_content: 'La introducción de la canción es incorrecta',
            detail_content: 'Los detalles de la canción son incorrectos',
            artist_bio_content: 'La biografía del artista es incorrecta',
            audio_narration: 'Problema de audio o narración',
            translation_language: 'Problema de traducción o idioma',
            playback_controls: 'Problema de reproducción o botones',
            other: 'Algo más'
        },
        ptbr: {
            wrong_spotify_track: 'A música ou gravação errada abriu no Spotify',
            intro_content: 'A introdução da música está incorreta',
            detail_content: 'Os detalhes da faixa estão incorretos',
            artist_bio_content: 'A biografia do artista está incorreta',
            audio_narration: 'Problema de áudio ou narração',
            translation_language: 'Problema de tradução ou idioma',
            playback_controls: 'Problema de reprodução ou botões',
            other: 'Outra coisa'
        }
    };

    let issues: ContentIssueType[] = [];
    let details = '';
    let email = '';
    let sending = false;
    let submitted = false;
    let error = '';
    let dialog: HTMLDivElement;
    let previousFocus: HTMLElement | null = null;
    let wasOpen = false;
    let locale: Locale = 'en';
    let t: ModalCopy = copy.en;
    let previousBodyOverflow = '';

    function lockBodyScroll(): void {
        if (typeof document === 'undefined') return;
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }

    function restoreBodyScroll(): void {
        if (typeof document === 'undefined') return;
        document.body.style.overflow = previousBodyOverflow;
    }

    $: locale = language === 'es'
        ? 'es'
        : language === 'ptbr' || language === 'pt-BR'
            ? 'ptbr'
            : 'en';
    $: t = copy[locale];

    $: if (open && !wasOpen) {
        wasOpen = true;
        previousFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        issues = initialIssueType ? [initialIssueType] : [];
        details = '';
        email = '';
        error = '';
        submitted = false;
        lockBodyScroll();
        tick().then(() => dialog?.querySelector<HTMLInputElement>('input')?.focus());
    } else if (!open && wasOpen) {
        wasOpen = false;
        restoreBodyScroll();
        previousFocus?.focus();
        previousFocus = null;
    }

    function close(): void {
        if (!sending) onClose();
    }

    function trapFocus(event: KeyboardEvent): void {
        const focusable = Array.from(
            dialog?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), textarea:not([disabled])'
            ) ?? []
        );
        const first = focusable[0];
        const last = focusable.at(-1);

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
        }
    }

    function handleKeydown(event: KeyboardEvent): void {
        if (!open) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'Tab') {
            trapFocus(event);
        }
    }

    function isValidOptionalEmail(value: string): boolean {
        return value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    async function send(): Promise<void> {
        if (issues.length === 0 || !context || sending) return;

        const trimmedEmail = email.trim();
        if (!isValidOptionalEmail(trimmedEmail)) {
            error = t.invalidEmail;
            return;
        }

        sending = true;
        error = '';
        try {
            await submitFeedback({
                type: 'bug',
                category: 'content_issue',
                title: `${issueLabels.en[issues[0]]} — ${
                    context.expected_track_name ?? 'Unknown track'
                } — ${context.expected_artist_name ?? 'Unknown artist'}`,
                message: details.trim() || t.none,
                email: trimmedEmail || undefined,
                route: context.page_route,
                metadata: {
                    ...context,
                    issue_types: issues,
                    // Retain the original field for consumers that have not adopted issue_types yet.
                    issue_type: issues[0]
                }
            });
            submitted = true;
        } catch {
            error = t.error;
        } finally {
            sending = false;
        }
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    });

    onDestroy(restoreBodyScroll);
</script>

{#if open && context}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="backdrop" on:click={close}></div>

    <!-- Clicking inside the dialog must not activate the backdrop close behavior. -->
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
        bind:this={dialog}
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-problem-title"
        aria-describedby={submitted
            ? 'report-problem-help'
            : 'report-problem-help report-problem-error'}
        tabindex="-1"
        on:click|stopPropagation
    >
        <button
            class="close-button"
            type="button"
            on:click={close}
            disabled={sending}
            aria-label={t.close}
        >
            ×
        </button>
        {#if submitted}
            <h2 id="report-problem-title">{t.title}</h2>
            <p class="success" id="report-problem-help">{t.success}</p>
            <button type="button" on:click={close}>{t.close}</button>
        {:else}
            <h2 id="report-problem-title">{t.title}</h2>
            <p class="visually-hidden" id="report-problem-help">{t.emailHint}</p>
            <fieldset>
                <legend>{t.selectAllThatApply}</legend>
                {#each CONTENT_ISSUE_TYPES as value}
                    <label class:choice-selected={issues.includes(value)} class="choice">
                        <input type="checkbox" bind:group={issues} value={value}/>
                        <span>{issueLabels[locale][value]}</span>
                    </label>
                {/each}
            </fieldset>
            <label for="report-problem-details">{t.details}</label>
            <textarea id="report-problem-details" bind:value={details} rows="3"></textarea>
            <label for="report-problem-email">{t.email}</label>
            <input
                id="report-problem-email"
                type="email"
                bind:value={email}
                autocomplete="email"
                aria-describedby="report-problem-help report-problem-error"
                aria-invalid={error === t.invalidEmail}
            />
            <p class="email-hint">{t.emailHint}</p>
            <p id="report-problem-error" class="error" aria-live="assertive">
                {error}
            </p>
            <div class="actions">
                <button type="button" on:click={close} disabled={sending}>{t.close}</button>
                <button type="button" on:click={send} disabled={issues.length === 0 || sending}>
                    {sending ? t.sending : t.send}
                </button>
            </div>
        {/if}
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1300;
        background: #000b;
    }

    .dialog {
        position: fixed;
        z-index: 1301;
        top: 5vh;
        left: 50%;
        width: min(620px, 94vw);
        max-height: 90vh;
        overflow: auto;
        padding: 24px;
        transform: translateX(-50%);
        border-radius: 16px;
        background: #121212;
        color: #fff;
        font-size: 1.05rem;
    }

    fieldset {
        display: grid;
        gap: 0;
        margin: 14px 0;
        padding: 0;
        border: 0;
        min-inline-size: 0;
    }

    label:not(.choice) {
        display: grid;
        gap: 7px;
        margin: 18px 0 7px;
    }

    .choice {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 56px;
        padding: 8px 10px;
        border: 0;
        border-bottom: 1px solid #ffffff24;
        cursor: pointer;
        transition: background-color 120ms ease;
    }

    .choice:last-of-type {
        border-bottom: 0;
    }

    .choice:hover {
        background: #ffffff0d;
    }

    .choice-selected {
        background: #d7b85b26;
    }

    .choice-selected:hover {
        background: #d7b85b33;
    }

    .choice:focus-within {
        outline: 3px solid #d7b85b;
        outline-offset: -3px;
    }

    .choice input {
        width: 22px;
        height: 22px;
    }

    textarea,
    input {
        box-sizing: border-box;
        width: 100%;
        padding: 10px;
        border: 1px solid #bbb;
        border-radius: 7px;
        font: inherit;
    }

    .email-hint {
        margin: 6px 0 20px;
        color: #ddd;
        font-size: 0.9rem;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-bottom: 2px;
    }

    .actions button,
    .close-button,
    .success + button {
        min-height: 46px;
        padding: 10px 18px;
        border: 0;
        border-radius: 8px;
        font: inherit;
        font-weight: 800;
    }

    .actions button:last-child,
    .close-button,
    .success + button {
        background: #d7b85b;
        color: #151515;
    }

    .actions button:disabled {
        background: #5e5e5e;
        color: #f5f5f5;
        cursor: not-allowed;
    }

    .close-button {
        position: absolute;
        top: 10px;
        right: 12px;
    }

    .error {
        min-height: 1.5em;
        color: #ff9c9c;
    }

    .success {
        font-size: 1.15rem;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }

    @media (max-width: 480px) {
        .dialog {
            top: 3vh;
            width: min(620px, 96vw);
            max-height: 94vh;
            padding: 20px;
        }

        .actions {
            flex-direction: column-reverse;
        }

        .actions button {
            width: 100%;
        }
    }
</style>
