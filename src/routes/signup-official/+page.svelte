<script lang="ts">
        import { goto } from '$app/navigation';
        import { getBackendUrl } from '$lib/config';
        import { supabase } from '$lib/supabaseClient';

        let email = '';
        let verificationCode = '';
        let codeRequested = false;
        let isLoading = false;
        let errorMessage = '';
        let statusMessage = '';

        function goBack() {
                history.back();
        }

        function signUpWithSpotify() {
                window.location.href =
                        `${getBackendUrl()}/api/auth/spotify/login`;
        }

        async function requestCode() {
                errorMessage = '';
                statusMessage = '';

                const normalizedEmail = email.trim().toLowerCase();

                if (!normalizedEmail) {
                        errorMessage = 'Enter your email address.';
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
                                'Check your email for your six-digit sign-up code.';
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
                                        'Please wait about 60 seconds before requesting another sign-up code.';
                        } else {
                                errorMessage =
                                        'We could not send your sign-up code. Please try again.';
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
                        errorMessage = 'Enter the sign-up code from your email.';
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
                                                access_token: supabaseAccessToken
                                        })
                                }
                        );

                        const result = await response.json().catch(() => null);

                        if (!response.ok) {
                                throw new Error(
                                        result?.detail ??
                                                'TopSpot40 sign-up failed.'
                                );
                        }

                        await goto('/create-account');
                } catch (error) {
                        console.error('Unable to complete sign-up:', error);

                        errorMessage =
                                error instanceof Error
                                        ? error.message
                                        : 'We could not complete sign-up.';
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
                Go Back
        </button>
</div>

<div class="signup-container">
        <div class="signup-card">
                <h1>Sign Up</h1>

                <p class="intro">
                        Create your TopSpot40 account with your email address.
                </p>

                {#if !codeRequested}
                        <form on:submit|preventDefault={requestCode}>
                                <label for="email">Email address</label>

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
                                                ? 'Sending code...'
                                                : 'Send sign-up code'}
                                </button>
                        </form>
                {:else}
                        <form on:submit|preventDefault={verifyCode}>
                                <p class="code-sent">
                                        We sent a sign-up code to
                                        <strong>{email}</strong>.
                                </p>

                                <label for="verification-code">
                                        Six-digit sign-up code
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
                                                ? 'Creating account...'
                                                : 'Verify and create account'}
                                </button>

                                <button
                                        type="button"
                                        class="secondary-button"
                                        on:click={changeEmail}
                                        disabled={isLoading}
                                >
                                        Use a different email
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
                        Already have a TopSpot40 account?
                        <a href="/signin">Sign in</a>
                </p>

                <div class="fallback">
                        <span>Temporary fallback</span>

                        <button
                                type="button"
                                on:click={signUpWithSpotify}
                                class="spotify-signup-button"
                                disabled={isLoading}
                        >
                                Sign up with Spotify
                        </button>
                </div>
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

        input:disabled,
        button:disabled {
                cursor: not-allowed;
                opacity: 0.65;
        }

        .primary-button,
        .secondary-button,
        .spotify-signup-button {
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

        .fallback {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-top: 2rem;
                padding-top: 1.5rem;
                border-top: 1px solid #444;
                text-align: center;
        }

        .fallback span {
                color: #aaa;
                font-size: 0.85rem;
        }

        .spotify-signup-button {
                background-color: #333;
                color: white;
        }

        .spotify-signup-button:hover:not(:disabled) {
                background-color: #444;
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
