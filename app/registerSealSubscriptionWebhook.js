export const registerSealSubscriptionWebhook = async () => {
  try {
    const { SEAL_API_TOKEN, SEAL_API_SECRET, SHOPIFY_APP_URL } = process.env;

    if (!SEAL_API_TOKEN || !SEAL_API_SECRET || !SHOPIFY_APP_URL) {
      return { status: 500, success: false, error: 'Missing environment variables.' };
    }

    const webhooks = [
      { topic: 'subscription/created', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/create` },
      { topic: 'subscription/paused', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/pause` },
      { topic: 'subscription/resumed', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/resume` },
      { topic: 'subscription/expired', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/expire` },
      { topic: 'subscription/cancelled', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/cancel` },
    ];

    // Map each webhook to a fetch request
    const promises = webhooks.map(async (wh) => {
      const res = await fetch(`https://app.sealsubscriptions.com/shopify/merchant/api/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Seal-Token': SEAL_API_TOKEN,
        },
        body: JSON.stringify(wh),
      });

      const data = await res.json();
      return { topic: wh.topic, status: res.status, data };
    });

    // Wait for all to finish
    const results = await Promise.all(promises);

    console.log('Webhook registration results:', results);

    return { success: true, results };
  } catch (error) {
    console.error('Error while registering the webhook:', error);
    return {
      status: 500,
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error.',
    };
  }
};
