import { authenticate } from "../shopify.server";

const processWebhook = async({admin, payload})=>{
    try {
         const subscriptionContract = payload;
    const customerId = subscriptionContract.customer_id;
    
    // Update customer metafields when subscription is created
    
    const mutation = `
      mutation customerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer {
            id
            metafields(first: 10) {
              edges {
                node {
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    await admin.graphql(mutation, {
      variables: {
        input: {
          id: `gid://shopify/Customer/${customerId}`,
          metafields: [
            {
              namespace: "subscriptions",
              key: "status",
              value: "active",
              type: "single_line_text_field"
            },
            {
              namespace: "subscriptions", 
              key: "plan",
              value: subscriptionContract.billing_policy?.interval || "monthly",
              type: "single_line_text_field"
            },
            {
              namespace: "subscriptions",
              key: "renewal_date", 
              value: subscriptionContract.next_billing_date || "",
              type: "single_line_text_field"
            }
          ]
        }
      }
    });

    } catch (error) {
        
    }
}

export const action = async ({ request }) => {
  try {
    console.log(`Received subscription_contracts/created webhook`);
    const { payload, admin } = await authenticate.webhook(request);

    processWebhook({admin, payload})
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
};
