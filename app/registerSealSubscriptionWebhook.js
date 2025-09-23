export const registerSealSubscriptionWebhook = async () => {
  try {
    const { SEAL_API_TOKEN, SHOPIFY_APP_URL } = process.env;

    if (!SEAL_API_TOKEN || !SHOPIFY_APP_URL) {
      return { status: 500, success: false, error: 'Missing environment variables.' };
    }

    const getRes = await fetch('https://app.sealsubscriptions.com/shopify/merchant/api/webhooks', {
      method: 'GET',
      headers: { 'X-Seal-Token': SEAL_API_TOKEN },
    });

    const getData = await getRes.json();
    if (!getData.success) {
      return { status: getRes.status, success: false, error: 'Failed to fetch existing webhooks.' };
    }

    const existingWebhooks = getData.payload?.webhooks || [];

    const deletePromises = existingWebhooks.map(async (wh) => {
      const res = await fetch(`https://app.sealsubscriptions.com/shopify/merchant/api/webhooks?id=${wh.id}`, {
        method: 'DELETE',
        headers: { 'X-Seal-Token': SEAL_API_TOKEN },
      });
      return { id: wh.id, status: res.status };
    });

    const deleteResults = await Promise.all(deletePromises);
    console.log('Deleted webhooks:', deleteResults);

    const newWebhooks = [
      { topic: 'subscription/created', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/create` },
      { topic: 'subscription/paused', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/pause` },
      { topic: 'subscription/resumed', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/resume` },
      { topic: 'subscription/expired', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/expire` },
      { topic: 'subscription/cancelled', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/cancel` },
      { topic: 'subscription/updated', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/update` },
      { topic: 'subscription/reactivated', address: `${SHOPIFY_APP_URL}/api/v1/seal-subscriptions/reactivate` },
    ];

    const createPromises = newWebhooks.map(async (wh) => {
      const res = await fetch('https://app.sealsubscriptions.com/shopify/merchant/api/webhooks', {
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

    const createdResults = await Promise.all(createPromises);
    console.log('Created webhooks:', createdResults);

    return { success: true, deleted: deleteResults, created: createdResults };
  } catch (error) {
    console.error('Error resetting Seal webhooks:', error);
    return {
      status: 500,
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error.',
    };
  }
};
