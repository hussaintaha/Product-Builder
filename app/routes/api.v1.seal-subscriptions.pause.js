import Subscription from "../model/subscription.model";

export const action = async ({ request }) => {
    console.log('pause trigger');

    try {

        const payload = await request.json()
        const { id: subscriptionId } = payload

        const subscription = await Subscription.findOneAndUpdate(
            { subscriptionId },
            {
                $set: {
                    status: "PAUSED",
                    pausedOn: new Date(),
                },
            },
            { new: true }
        );

        if (!subscription) {
            return new Response(JSON.stringify({ success: false, error: "Subscription not found" }), { status: 404 });
        }

        const replitResponse = await fetch(`https://e04e1f45-ddfa-4cfd-aa2c-825ae20bc005-00-4q1rcyndehbs.kirk.replit.dev/api/customers/${payload.customer_id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                subscription_status: String(payload?.status),
            })
        })

        const data = await replitResponse.json()

        const { success, message, data: replitData } = data
        console.log('message: ', message);

        return new Response(JSON.stringify({ success: true, message: "Subscription has been paused." }), { status: 200 })

    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error while pause subscription: ${error.message}`);
        } else {
            console.log(`An unknown error occurred.`);
        }

        return new Response(JSON.stringify({ success: false, error: "Internal server error." }), { status: 500 })
    }
}