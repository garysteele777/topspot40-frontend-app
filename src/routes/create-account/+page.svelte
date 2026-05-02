<script lang="ts">
  import { getBackendUrl } from '$lib/config';
  console.log('🚀 create-account page loaded');

  //import { browser } from '$app/environment';

  export let data;

  type CheckoutResponse =
    | { url: string }
    | { error: string }
    | Record<string, unknown>;

  async function startCheckout() {
    try {
      // Determine backend URL
      /*const BACKEND_URL = window.location.hostname === 'localhost'
        ? 'http://127.0.0.1:8000' // local dev backend
        : 'https://api.topspot40.com'; // production backend*/

      const BACKEND_URL = getBackendUrl(); // dynamic backend
      console.log('Using backend URL:', BACKEND_URL);


      const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST',
        credentials: 'include'
      });

      // Ensure JSON response
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON, got ${contentType || 'unknown content-type'}`);
      }

      const data: CheckoutResponse = await res.json();
      console.log('Stripe response:', data);

      if ('url' in data && typeof data.url === 'string') {
        window.location.assign(data.url); // redirect to Stripe Checkout
        return;
      }
      if ('error' in data && typeof data.error === 'string') {
        alert('Checkout error: ' + data.error);
        return;
      }

      alert('Unexpected response from server.');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Unknown error';
      alert('Network error: ' + msg);
    }
  }
</script>

{#if !data.user}
  <div class="auth-container">
    <div class="auth-card">  
      <h2>Authentication Required</h2>
      <p>If you’re not logged in, please sign in with Spotify first.</p>
      <button class="auth-button" on:click={() => window.location.href = '/signup-official'}>
        Go to Sign In
      </button>
    </div>
  </div>
{/if}


<div class="container">
  <h1>Welcome to TopSpot40!</h1>
  <p>You’re all set with Spotify Premium — now let’s create your account.</p>
  <button on:click={startCheckout}> Continue to Subscription </button>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    text-align: center;
  }

  button {
    background: #1db954; /* Spotify green */
    color: white;
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 5px;
    font-size: 1.1rem;
    cursor: pointer;
  }

  button:hover {
    background: #17a74b;
  }


  

.auth-container {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-card {
  max-width: 420px;
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.auth-card h2 {
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.auth-card p {
  font-size: 0.95rem;
  opacity: 0.8;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.auth-button {
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;

  background: #1db954; /* Spotify green vibe */
  color: white;
  font-weight: 600;
  font-size: 0.95rem;

  transition: transform 0.15s ease, opacity 0.15s ease;
}

.auth-button:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.auth-button:active {
  transform: translateY(0px);
}



</style>
