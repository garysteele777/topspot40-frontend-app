<script lang="ts">
        import { goto } from '$app/navigation';
        import { onMount } from 'svelte';
        import { getBackendUrl } from '$lib/config';
        import { readLanguagePreference } from '$lib/languagePreferences';
        import { supabase } from '$lib/supabaseClient';

        let language: 'en' | 'es' = 'en';
        let email = '';
        let marketingOptIn = false;
        let verificationCode = '';
        let codeRequested = false;
        let isLoading = false;
        let errorMessage = '';
        let statusMessage = '';

        const copy = {
                en: {
                        back: 'Go Back', title: 'Sign Up', intro: 'Create your TopSpot40 account with your email address.', email: 'Email address', marketing: 'Send me occasional TopSpot40 updates and early-member offers.', optional: 'Optional. You can unsubscribe at any time.', sending: 'Sending code...', send: 'Send sign-up code', sent: 'We sent a sign-up code to', code: 'Six-digit sign-up code', creating: 'Creating account...', verify: 'Verify and create account', differentEmail: 'Use a different email', account: 'Already have a TopSpot40 account?', signIn: 'Sign in', enterEmail: 'Enter your email address.', checkEmail: 'Check your email for your six-digit sign-up code.', wait: 'Please wait about 60 seconds before requesting another sign-up code.', sendError: 'We could not send your sign-up code. Please try again.', enterCode: 'Enter the sign-up code from your email.', signupError: 'TopSpot40 sign-up failed.', completeError: 'We could not complete sign-up.'
                },
                es: {
                        back: 'Volver', title: 'Crear una cuenta', intro: 'Crea tu cuenta de TopSpot40 con tu dirección de correo electrónico.', email: 'Dirección de correo electrónico', marketing: 'Envíame novedades ocasionales de TopSpot40 y ofertas para miembros fundadores.', optional: 'Opcional. Puedes dejar de recibir estos mensajes en cualquier momento.', sending: 'Enviando código...', send: 'Enviar código de registro', sent: 'Enviamos un código de registro a', code: 'Código de registro de seis dígitos', creating: 'Creando cuenta...', verify: 'Verificar y crear cuenta', differentEmail: 'Usar otro correo electrónico', account: '¿Ya tienes una cuenta de TopSpot40?', signIn: 'Iniciar sesión', enterEmail: 'Ingresa tu dirección de correo electrónico.', checkEmail: 'Revisa tu correo electrónico para obtener tu código de registro de seis dígitos.', wait: 'Espera unos 60 segundos antes de solicitar otro código de registro.', sendError: 'No pudimos enviar tu código de registro. Inténtalo de nuevo.', enterCode: 'Ingresa el código de registro de tu correo electrónico.', signupError: 'No se pudo crear tu cuenta de TopSpot40.', completeError: 'No pudimos completar el registro.'
                }
        } as const;

        onMount(() => {
                language = readLanguagePreference() === 'es' ? 'es' : 'en';
        });

        function goBack() {
                history.back();
        }

        async function requestCode() {
                errorMessage = '';
                statusMessage = '';

                const normalizedEmail = email.trim().toLowerCase();

                if (!normalizedEmail) {
                        errorMessage = copy[language].enterEmail;
                        return;
                }

                isLoading = true;

                try {
                        const { error } = await supabase.auth.signInWithOtp({
                                email: normalizedEmail,
                                options: {
                                        shouldCreateUser: true
                                }
                        });

                        if (error) {
                                throw error;
                        }

                        email = normalizedEmail;
                        codeRequested = true;
                        statusMessage =
                                copy[language].checkEmail;
                } catch (error) {
                        console.error('Unable to send sign-up code:', error);

                        const authError = error as {
                                status?: number;
                                message?: string;
                        };

                        if (
                                authError?.status === 429 ||
                                authError?.message?.toLowerCase().includes('seconds')
                        ) {
                                errorMessage =
                                        copy[language].wait;
                        } else {
                                errorMessage =
                                        copy[language].sendError;
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
                        errorMessage = copy[language].enterCode;
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
                                `${getBackendUrl()}/api/auth/supabase/signup`,
                                {
                                        method: 'POST',
                                        credentials: 'include',
                                        headers: {
                                                'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                                access_token: supabaseAccessToken,
                                                marketing_opt_in: marketingOptIn
                                        })
                                }
                        );

                        const result = await response.json().catch(() => null);

                        if (!response.ok) {
                                throw new Error(
                                        result?.detail ??
                                                copy[language].signupError
                                );
                        }

                        await goto('/create-account');
                } catch (error) {
                        console.error('Unable to complete sign-up:', error);

                        errorMessage =
                                error instanceof Error
                                        ? (language === 'es' ? copy[language].completeError : error.message)
                                        : copy[language].completeError;
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
</script>

<div class="go-back-button-wrapper">
        <button on:click={goBack} class="go-back-button">
                {copy[language].back}
        </button>
</div>

<div class="signup-container">
        <div class="signup-card">
                <h1>{copy[language].title}</h1>

                <p class="intro">
                        {copy[language].intro}
                </p>

                {#if !codeRequested}
                        <form on:submit|preventDefault={requestCode}>
                                <label for="email">{copy[language].email}</label>

                                <input
                                        id="email"
                                        type="email"
                                        bind:value={email}
                                        autocomplete="email"
                                        placeholder="you@example.com"
                                        disabled={isLoading}
                                        required
                                />

                                <label class="marketing-opt-in">
                                        <input
                                                type="checkbox"
                                                bind:checked={marketingOptIn}
                                                disabled={isLoading}
                                        />
                                        <span>
                                                {copy[language].marketing}
                                        </span>
                                </label>

                                <p class="marketing-supporting-text">
                                        {copy[language].optional}
                                </p>

                                <button
                                        type="submit"
                                        class="primary-button"
                                        disabled={isLoading}
                                >
                                        {isLoading
                                                ? copy[language].sending
                                                : copy[language].send}
                                </button>
                        </form>
                {:else}
                        <form on:submit|preventDefault={verifyCode}>
                                <p class="code-sent">
                                        {copy[language].sent}
                                        <strong>{email}</strong>.
                                </p>

                                <label for="verification-code">
                                        {copy[language].code}
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
                                                ? copy[language].creating
                                                : copy[language].verify}
                                </button>

                                <button
                                        type="button"
                                        class="secondary-button"
                                        on:click={changeEmail}
                                        disabled={isLoading}
                                >
                                        {copy[language].differentEmail}
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

                <p class="signin-link">
                        {copy[language].account}
                        <a href="/signin">{copy[language].signIn}</a>
                </p>

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

        .signup-container {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                box-sizing: border-box;
                padding: 5rem 1rem 2rem;
                background: linear-gradient(135deg, #121212, #1db95420);
        }

        .signup-card {
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

        .marketing-opt-in {
                display: flex;
                align-items: center;
                min-height: 44px;
                padding: 0.5rem 0;
                gap: 0.65rem;
                font-weight: 400;
                line-height: 1.4;
                cursor: pointer;
        }

        .marketing-opt-in input[type="checkbox"] {
                width: 20px;
                height: 20px;
                margin: 0;
                padding: 0;
                flex: 0 0 auto;
        }

        .marketing-opt-in input[type="checkbox"]:focus-visible {
                outline: 3px solid rgba(29, 185, 84, 0.75);
                outline-offset: 3px;
        }

        .marketing-supporting-text {
                margin: -0.3rem 0 0;
                color: #bbb;
                font-size: 0.9rem;
                line-height: 1.4;
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

        .signin-link {
                margin-top: 1.5rem;
                text-align: center;
                color: #ddd;
        }

        .signin-link a {
                color: #7ee29c;
                font-weight: 700;
        }

        @media (max-width: 640px) {
                .signup-card {
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
