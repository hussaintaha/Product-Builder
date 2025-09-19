import Subscription from "../model/subscription.model";


export const action = async ({ request }) => {
    console.log('create trigger');

  try {
    const payload = await request.json();

    const subscriptionData = {
      subscriptionId: payload.id,
      internalId: payload.internal_id,
      orderId: payload.order_id,
      customerId: payload.customer_id,

      email: payload.email,
      firstName: payload.first_name,
      lastName: payload.last_name,

      status: payload.status,
      subscriptionType: payload.subscription_type,

      deliveryInterval: payload.delivery_interval,
      billingInterval: payload.billing_interval,

      shippingAddress: {
        firstName: payload.s_first_name,
        lastName: payload.s_last_name,
        address1: payload.s_address1,
        city: payload.s_city,
        province: payload.s_province,
        provinceCode: payload.s_province_code,
        zip: payload.s_zip,
        country: payload.s_country,
        countryCode: payload.s_country_code,
      },

      totalValue: payload.total_value,
      currency: payload.currency,

      items: (payload.items || []).map((item) => ({
        productId: item.product_id,
        variantId: item.variant_id,
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        finalAmount: item.final_amount,
        sellingPlanId: item.selling_plan_id,
        sellingPlanName: item.selling_plan_name,
      })),

      sealEditUrl: payload.edit_url,
      cancellationReason: payload.cancellation_reason,
      cancelledOn: payload.cancelled_on ? new Date(payload.cancelled_on) : null,
      pausedOn: payload.paused_on ? new Date(payload.paused_on) : null,

      shopifyGraphqlSubscriptionContractId: payload.shopify_graphql_subscription_contract_id || null,
      tags: payload.tags || [],

      rawPayload: payload,
    };

    const isExistSubscription = await Subscription.findOneAndDelete({customerId: payload.customer_id})

    const updatedSubscription = await Subscription.findOneAndUpdate(
      { subscriptionId: payload.id },
      { $set: subscriptionData },
      { upsert: true, new: true }
    );

    const replitResponse = await fetch(`https://e04e1f45-ddfa-4cfd-aa2c-825ae20bc005-00-4q1rcyndehbs.kirk.replit.dev/api/customers/${payload.customer_id}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_id: String(payload?.id),
        subscription_status: String(payload?.status),
        subscription_interval: String(payload?.delivery_interval),
        plan_name: String(subscriptionData?.items?.[0]?.sellingPlanName)
      })
    })

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
