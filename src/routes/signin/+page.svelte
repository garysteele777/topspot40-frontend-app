<script lang="ts">
        import { goto } from '$app/navigation';
        import { onMount } from 'svelte';
        import { getBackendUrl } from '$lib/config';
        import { readLanguagePreference } from '$lib/languagePreferences';
        import { supabase } from '$lib/supabaseClient';
        import posthog from 'posthog-js';
        import { identifyPostHogUser } from '$lib/analytics/posthog';

        let language: 'en' | 'es' | 'pt-BR' = 'en';
        let email = '';
        let verificationCode = '';
        let codeRequested = false;
        let isLoading = false;
        let errorMessage = '';
        let statusMessage = '';
        const localized = {
                en: { back: 'Go Back', title: 'Sign In', intro: 'Sign in to continue to your TopSpot40 account.', email: 'Email address', send: 'Send sign-in code', sending: 'Sending code...', sent: 'Check your email for your six-digit sign-in code.', code: 'Six-digit sign-in code', verify: 'Verify and sign in', signing: 'Signing in...', different: 'Use a different email', signup: 'Sign Up', enterEmail: 'Enter your email address.', enterCode: 'Enter the sign-in code from your email.', wait: 'Please wait about 60 seconds before requesting another sign-in code.', startError: 'We could not start sign-in. If you are new to TopSpot40, choose Sign Up.', completeError: 'We could not complete sign-in.' },
                es: { back: 'Volver', title: 'Iniciar sesion', intro: 'Inicia sesion para continuar en tu cuenta TopSpot40.', email: 'Correo electronico', send: 'Enviar codigo de acceso', sending: 'Enviando codigo...', sent: 'Revisa tu correo para encontrar tu codigo de seis digitos.', code: 'Codigo de acceso de seis digitos', verify: 'Verificar e iniciar sesion', signing: 'Iniciando sesion...', different: 'Usar otro correo', signup: 'Crear cuenta', enterEmail: 'Ingresa tu correo electronico.', enterCode: 'Ingresa el codigo de tu correo.', wait: 'Espera unos 60 segundos antes de solicitar otro codigo.', startError: 'No pudimos iniciar sesion. Si eres nuevo, crea una cuenta.', completeError: 'No pudimos completar el inicio de sesion.' },
                'pt-BR': { back: 'Voltar', title: 'Entrar', intro: 'Entre para continuar na sua conta TopSpot40.', email: 'Endereco de e-mail', send: 'Enviar codigo de acesso', sending: 'Enviando codigo...', sent: 'Verifique seu e-mail para encontrar o codigo de seis digitos.', code: 'Codigo de acesso de seis digitos', verify: 'Verificar e entrar', signing: 'Entrando...', different: 'Usar outro e-mail', signup: 'Criar conta', enterEmail: 'Informe seu endereco de e-mail.', enterCode: 'Informe o codigo enviado para seu e-mail.', wait: 'Aguarde cerca de 60 segundos antes de solicitar outro codigo.', startError: 'Nao foi possivel iniciar sessao. Se voce e novo, crie uma conta.', completeError: 'Nao foi possivel concluir o acesso.' }
        } as const;
        $: text = localized[language];

        function goBack() {
                history.back();
        }

        async function requestCode() {
                errorMessage = '';
                statusMessage = '';

                const normalizedEmail = email.trim().toLowerCase();

                if (!normalizedEmail) {
                        errorMessage = text.enterEmail;
                        return;
                }

                isLoading = true;

                try {
                        const { error } = await supabase.auth.signInWithOtp({
                                email: normalizedEmail,
                                options: {
                                        shouldCreateUser: false
                                }
                        });

                        if (error) {
                                throw error;
                        }

                        email = normalizedEmail;
                        codeRequested = true;
                        statusMessage = text.sent;
                } catch (error) {
                        console.error('Unable to send sign-in code:', error);

                        const authError = error as {
                                status?: number;
                                message?: string;
                        };

                        if (
                                authError?.status === 429 ||
                                authError?.message?.toLowerCase().includes('seconds')
                        ) {
                                errorMessage =
                                text.wait;
                        } else {
                                errorMessage =
                                text.startError;
                        }
                } finally {
                        isLoading = false;
                }
        }

        async function verifyCode() {
                errorMessage = '';
                statusMessage = '';

                const token = verificationCode.trim();

                if (!token) {
                        errorMessage = text.enterCode;
                        return;
                }

                isLoading = true;

                try {
                        const { data, error } = await supabase.auth.verifyOtp({
                                email,
                                token,
                                type: 'email'
                        });

                        if (error) {
                                throw error;
                        }

                        const supabaseAccessToken = data.session?.access_token;

                        if (!supabaseAccessToken) {
                                throw new Error(
                                        'Supabase did not return an access token.'
                                );
                        }

                        const response = await fetch(
                                `${getBackendUrl()}/api/auth/supabase/session`,
                                {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: {
                                                'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                                access_token: supabaseAccessToken
                                        })
                                }
                        );

                        const result = await response.json().catch(() => null);

                        if (!response.ok) {
                                throw new Error(
                                        result?.detail ??
                                                text.completeError
                                );
                        }

                        identifyPostHogUser(posthog, { id: result?.user_id });

                        if (result?.profile_completion_required) {
                                await goto('/complete-profile');
                        } else {
                                await goto('/dashboard');
                        }
                } catch (error) {
                        console.error('Unable to verify sign-in code:', error);

                        errorMessage = text.completeError;
                } finally {
                        isLoading = false;
                }
        }

        function changeEmail() {
                verificationCode = '';
                codeRequested = false;
                errorMessage = '';
                statusMessage = '';
        }

        onMount(() => {
                const savedLanguage = readLanguagePreference();
                language = savedLanguage === 'es' ? 'es' : savedLanguage === 'ptbr' ? 'pt-BR' : 'en';
        });
</script>

<div class="go-back-button-wrapper">
        <button on:click={goBack} class="go-back-button">
                {text.back}
        </button>
</div>

<div class="signin-container">
        <div class="signin-card">
                <h1>{text.title}</h1>
                <p class="intro">
                        {text.intro}
                </p>

                {#if !codeRequested}
                        <form on:submit|preventDefault={requestCode}>
                                <label for="email">{text.email}</label>

                                <input
                                        id="email"
                                        type="email"
                                        bind:value={email}
                                        autocomplete="email"
                                        placeholder="you@example.com"
                                        disabled={isLoading}
                                        required
                                />

                                <button
                                        type="submit"
                                        class="primary-button"
                                        disabled={isLoading}
                                >
                                        {isLoading
                                                ? text.sending
                                                : text.send}
                                </button>
                        </form>
                {:else}
                        <form on:submit|preventDefault={verifyCode}>
                                <p class="code-sent">
                                        {text.sent}
                                        <strong>{email}</strong>.
                                </p>

                                <label for="verification-code">
                                        {text.code}
                                </label>

                                <input
                                        id="verification-code"
                                        type="text"
                                        inputmode="numeric"
                                        autocomplete="one-time-code"
                                        maxlength="6"
                                        bind:value={verificationCode}
                                        placeholder="000000"
                                        disabled={isLoading}
                                        required
                                />

                                <button
                                        type="submit"
                                        class="primary-button"
                                        disabled={isLoading}
                                >
                                        {isLoading
                                                ? text.signing
                                                : text.verify}
                                </button>

                                <button
                                        type="button"
                                        class="secondary-button"
                                        on:click={changeEmail}
                                        disabled={isLoading}
                                >
                                        {text.different}
                                </button>
                        </form>
                {/if}

                {#if statusMessage}
                        <p class="status-message">{statusMessage}</p>
                {/if}

                {#if errorMessage}
                        <p class="error-message" role="alert">
                                {errorMessage}
                        </p>
                {/if}

                <p class="signin-link"><a href="/signup-official">{text.signup}</a></p>
        </div>
</div>

<style>
        :global(body, html, #svelte) {
                margin: 0;
                padding: 0;
                min-height: 100%;
        }

        .go-back-button-wrapper {
                position: absolute;
                z-index: 10;
                padding: 1rem;
        }

        .go-back-button {
                margin: 1rem;
                background-color: #333;
                color: white;
                padding: 0.75rem 1.25rem;
                border-radius: 9999px;
                cursor: pointer;
                border: none;
                font-weight: 600;
                font-size: 1rem;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        }

        .go-back-button:hover {
                background-color: #1db954;
        }

        .signin-container {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                box-sizing: border-box;
                padding: 5rem 1rem 2rem;
                background: linear-gradient(135deg, #121212, #1db95420);
        }

        .signin-card {
                width: 100%;
                max-width: 430px;
                box-sizing: border-box;
                padding: 2rem;
                border-radius: 1rem;
                background: rgba(18, 18, 18, 0.94);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
                color: white;
        }

        h1 {
                margin: 0 0 0.75rem;
                text-align: center;
                font-size: 2.5rem;
        }

        .intro,
        .code-sent {
                color: #ddd;
                line-height: 1.5;
        }

        .intro {
                margin-bottom: 2rem;
                text-align: center;
        }

        form {
                display: flex;
                flex-direction: column;
                gap: 0.85rem;
        }

        label {
                font-weight: 700;
        }

        input {
                box-sizing: border-box;
                width: 100%;
                padding: 0.9rem 1rem;
                border: 1px solid #666;
                border-radius: 0.65rem;
                background: #fff;
                color: #111;
                font-size: 1rem;
        }

        input:focus {
                outline: 3px solid rgba(29, 185, 84, 0.35);
                border-color: #1db954;
        }

        input:disabled,
        button:disabled {
                cursor: not-allowed;
                opacity: 0.65;
        }

        .primary-button,
        .secondary-button {
                padding: 0.85rem 1.25rem;
                border-radius: 9999px;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                font-weight: 700;
        }

        .primary-button {
                margin-top: 0.5rem;
                background-color: #1db954;
                color: white;
        }

        .primary-button:hover:not(:disabled) {
                background-color: #17a34a;
        }

        .secondary-button {
                background: transparent;
                color: #ddd;
                text-decoration: underline;
        }

        .status-message {
                margin-top: 1.25rem;
                color: #b7f7c9;
                line-height: 1.5;
        }

        .error-message {
                margin-top: 1.25rem;
                color: #ffb4b4;
                line-height: 1.5;
        }

        @media (max-width: 640px) {
                .signin-card {
                        padding: 1.5rem;
                }

                h1 {
                        font-size: 2rem;
                }

                .go-back-button {
                        margin: 0.5rem;
                        padding: 0.65rem 1rem;
                        font-size: 0.95rem;
                }
        }
</style>
