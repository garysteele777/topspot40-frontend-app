<script lang="ts">
  console.log('🚀 create-account page loaded');

  import { browser } from '$app/environment';

  type CheckoutResponse =
    | { url: string }
    | { error: string }
    | Record<string, unknown>;

  async function startCheckout() {
    try {
      // Determine backend URL
      const BACKEND_URL = browser
        ? 'http://127.0.0.1:8000' // local dev backend
        : 'https://api.topspot40.com'; // production backend

      const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
        method: 'POST'
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
</style>
