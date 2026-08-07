<script lang="ts">
  import { getBackendUrl } from '$lib/config';
  console.log('🚀 create-account page loaded');

  //import { browser } from '$app/environment';

  export let data;

  $: accessState = data?.subscriptionStatus?.access_state;
  $: isExpired = accessState === 'expired';
  $: heading = isExpired ? 'Your promotional access has ended' : 'Choose your TopSpot40 plan';
  $: body = isExpired
    ? 'Choose a paid plan to continue using TopSpot40.'
    : 'Choose a paid plan to start using TopSpot40.';

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


<div class="container">
  <h1>{heading}</h1>
  <p>{body}</p>
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
