import { authenticate } from "../shopify.server";

const processWebhook = async ({ payload, shop }) => {

  try {

    const { id: customerId, email } = payload

    const response = await fetch('https://e04e1f45-ddfa-4cfd-aa2c-825ae20bc005-00-4q1rcyndehbs.kirk.replit.dev/api/customers', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customerId: String(customerId), email: String(email) })
    })

    const data = await response.json()

    const { success } = data

    if (!success) return new Response(JSON.stringify({ success: false, error: "Something went wrong." }), { status: 400 })

    return new Response(JSON.stringify({ success: true, message: "Customer created successfully." }), { status: 201 })

  } catch (error) {
    if (error instanceof Error) {
      console.log(`An error occurred while creating customer in replit app: ${error.message}`);
    } else {
      console.log(`An unknow error occurred.`);
    }

    return new Response(JSON.stringify({ success: false, error: "Internal server error." }), { status: 500 })
  }

}

export const action = async ({ request }) => {
  try {
    console.log(`Received customers/create webhook`);
    const { shop, payload } = await authenticate.webhook(request);
    processWebhook({ payload, shop });
    return new Response();
  } catch (error) {
    console.log("error occurred on customers/create", error);
    return new Response();
  }
};