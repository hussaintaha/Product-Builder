export const action = async ({ request }) => {
  try {
    if (request.method !== "POST")
      return new Response(JSON.stringify({ success: false, error: "Method not allowed." }), { status: 405 });

    const { SEAL_API_TOKEN } = process.env;

    if (!SEAL_API_TOKEN)
      return new Response(JSON.stringify({ success: false, error: "SEAL_API_TOKEN is not set in environment variables." }), { status: 500 });

    const body = await request.json();
    const { customerId } = body;

    if (!customerId)
      return new Response(JSON.stringify({ success: false, error: "Please provide customer Id." }), { status: 400 });

    // Get customer data
    const response = await fetch(
      `${process.env.BASE_URL}/${customerId}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );

    const customerData = await response.json();

    const { success, data } = customerData;

    if (!success)
      return new Response(JSON.stringify({ success: false, error: "Customer not found." }), { status: 404 });

    const { subscription_status, actual_attempts, used_attempt, subscribe_plan_name, subscription_id } = data;

    let sealSubscription = null;

    // 🔹 Paid plan → validate against Seal API
    if (subscribe_plan_name !== "Free" && subscription_id) {
      const sealResponse = await fetch(
        `https://app.sealsubscriptions.com/shopify/merchant/api/subscription?id=${subscription_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Seal-Token": SEAL_API_TOKEN,
          },
        }
      );

      if (!sealResponse.ok)
        return new Response(JSON.stringify({ success: false, error: "Failed to fetch subscription from Seal API." }), {
          status: sealResponse.status,
        });

      const sealData = await sealResponse.json();

      if (!sealData.success || !sealData.payload)
        return new Response(JSON.stringify({ success: false, error: "No subscription found at Seal API." }), { status: 404 });

      sealSubscription = sealData.payload;

      const sealStatus = sealSubscription.status?.toUpperCase();
      if (["EXPIRED", "CANCELLED"].includes(sealStatus)) {
        await fetch(
          `${process.env.BASE_URL}/${customerId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription_status: "expired" }),
          }
        );

        return new Response(
          JSON.stringify({ success: false, error: "Your subscription has expired. Please renew or upgrade." }),
          { status: 403 }
        );
      }
    }

    // 🔹 Free plan → validate attempts
    if (subscribe_plan_name === "Free" && subscription_status === "active") {
      if (Number(actual_attempts) === Number(used_attempt)) {
        await fetch(
          `${process.env.BASE_URL}/${customerId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription_status: "expired" }),
          }
        );

        return new Response(
          JSON.stringify({ success: false, error: "Your subscription limit has been reached. Please upgrade." }),
          { status: 403 }
        );
      }
    }

    // 🔹 Default success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Welcome, ${data?.first_name ?? ""} ${data?.last_name ?? ""}! You have subscribed to the ${subscribe_plan_name
          } plan ${subscribe_plan_name === "Free" ? `with ${Number(actual_attempts) - Number(used_attempt)} available attempts.` : "."}`,
        subscription: data,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while checking subscription:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error." }), { status: 500 });
  }
};
