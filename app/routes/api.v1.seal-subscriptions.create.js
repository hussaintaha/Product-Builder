export const action = async ({ request }) => {
  console.log('create trigger');

  try {
    const payload = await request.json();
    console.log('payload: ', payload);
    
    const replitResponse = await fetch(
      `${process.env.BASE_URL}/${payload.customer_id}`,
      {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: String(payload.id),
          subscriptionStatus: 'active',
          subscriptionInterval: String(payload.delivery_interval || ""),
          planName: String(payload.items?.[0]?.title  || ""),
          subscribePlanName: String(payload.items?.[0]?.title || ""),
          subscriptionPlanPrice: Number(payload.total_value || 0),
        })
      }
    );

    const data = await replitResponse.json()

    const { success, message, data: replitData } = data
    console.log('message: ', message);

    if (!success) new Response(JSON.stringify({ success: false, error: 'Something went wrong.' }), { status: 400 })

    return new Response(
      JSON.stringify({ success: true, message: "Subscription stored successfully.", data: replitData }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while creating/updating subscription:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  }
};
