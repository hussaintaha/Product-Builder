export const action = async ({ request }) => {
    try {
        if (request.method !== "POST") return new Response(JSON.stringify({ success: false, error: "Method not allowed." }), { status: 405 })

        const { SEAL_API_TOKEN, SEAL_API_SECRET, SHOPIFY_APP_URL } = process.env;

        if (!SEAL_API_TOKEN || !SEAL_API_SECRET || !SHOPIFY_APP_URL) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing environment variables." }),
                { status: 500 }
            );
        }

        const { subscriptionId, action } = await request.json()

        if (!subscriptionId || !action) return new Response(JSON.stringify({ success: false, error: "Please provide subscription Id and action." }), { status: 400 })

        const response = await fetch('https://app.sealsubscriptions.com/shopify/merchant/api/subscription', {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "X-Seal-Token": SEAL_API_TOKEN,
            },
            body: JSON.stringify({ id: String(subscriptionId), action: String(action) })
        })

        const data = await response.json()
        console.log('data: ', data);

        return new Response(JSON.stringify({ success: true, message: `Subscriction ${action} successfully.` }), { status: 200 })

    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error while managing subscriptions: ${error.message}`);
        } else {
            console.log(`An unknown error occurred.`);
        }

        return new Response(JSON.stringify({ success: false, error: "Internal server error." }), { status: 500 })
    }
}