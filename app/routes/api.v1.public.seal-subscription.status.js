import Subscription from "../model/subscription.model.js";

export const action = async ({ request }) => {
  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed." }),
        { status: 405 }
      );
    }

    const { SEAL_API_TOKEN, SEAL_API_SECRET, SHOPIFY_APP_URL } = process.env;

    if (!SEAL_API_TOKEN || !SEAL_API_SECRET || !SHOPIFY_APP_URL) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing environment variables." }),
        { status: 500 }
      );
    }

    const body = await request.json();
    const customerId = body?.customerId;

    if (!customerId) {
      return new Response(
        JSON.stringify({ success: false, error: "Customer ID is required." }),
        { status: 400 }
      );
    }

    // ✅ Await the DB call
    const existingSubscription = await Subscription.findOne({ customerId });

    if (!existingSubscription) {
      return new Response(
        JSON.stringify({ success: false, error: "Subscription not found in our records." }),
        { status: 404 }
      );
    }

    const { status: localStatus, subscriptionId } = existingSubscription;

    // ✅ Call Seal API
    const sealResponse = await fetch(
      `https://app.sealsubscriptions.com/shopify/merchant/api/subscription?id=${subscriptionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Seal-Token": SEAL_API_TOKEN,
        },
      }
    );

    if (!sealResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch subscription from Seal API." }),
        { status: sealResponse.status }
      );
    }

    const sealData = await sealResponse.json();

    if (!sealData.success || !sealData.payload) {
      return new Response(
        JSON.stringify({ success: false, error: "No subscription found at Seal API." }),
        { status: 404 }
      );
    }

    const { id, customer_id, status: sealStatus, items, first_name, last_name } =
      sealData.payload;

    // ✅ Build unified response object
    const subscription = {
      subscriptionId: id,
      customerId: customer_id,
      firstName: first_name,
      lastName: last_name,
      status: sealStatus,
      items,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome, ${first_name ?? ""} ${last_name ?? ""}!`,
        subscription,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while checking subscription:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  }
};
