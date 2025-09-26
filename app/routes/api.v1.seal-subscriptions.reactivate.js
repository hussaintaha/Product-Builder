export const action = async ({ request }) => {
    console.log('reactivate trigger');

    try {

        const payload = await request.json()

        const replitResponse = await fetch(`${process.env.BASE_URL}/${payload.customer_id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                subscriptionStatus: String(payload?.status).toLowerCase(),
            })
        })

        const data = await replitResponse.json()

        const { success, data: replitData } = data

        if (!success) return new Response(JSON.stringify({ success: false, message: "Failed to set subscription status to active." }), { status: 400 })

        return new Response(JSON.stringify({ success: true, message: "Subscription has been reactivated.", data: replitData }), { status: 200 })

    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error while reactivating subscription: ${error.message}`);
        } else {
            console.log(`An unknown error occurred.`);
        }

        return new Response(JSON.stringify({ success: false, error: "Internal server error." }), { status: 500 })
    }
}