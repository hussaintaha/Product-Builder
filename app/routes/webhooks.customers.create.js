import { authenticate } from "../shopify.server";

const processWebhook = async ({ payload }) => {
  console.log(`Customer creation initiated...`);
  try {
    const { id: customer_id, first_name, last_name, email } = payload;

    const newCustomer = {
      customerId: String(customer_id),
      firstName: String(first_name),
      lastName: String(last_name),
      email: String(email),
      subscriptionId: "",
      subscriptionStatus: "active",
      subscriptionInterval: "",
      planName: "Free",
      subscribePlanName: "Free",
      subscriptionPlanPrice: 0,
      actualAttempts: 3,
      used_attempt: 0,
    };


    const response = await fetch(
      `${process.env.BASE_URL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...newCustomer }),
      }
    );

    const data = await response.json();
    console.log('data: ', JSON.stringify(data, null, 2));
    const { success } = data;

    if (!success)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Something went wrong while creating the customer.",
        }),
        { status: 400 }
      );

    console.log(
      `Customer ${first_name} ${last_name} (${email}) successfully subscribed to the Free plan with 3 available attempts.`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Your account has been created and you have been subscribed to the Free plan with 3 available attempts.",
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        `An error occurred while creating customer in Replit app: ${error.message}`
      );
    } else {
      console.log(`An unknown error occurred.`);
    }

    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  }
};

export const action = async ({ request }) => {
  try {
    console.log(`Received customers/create webhook`);
    const { shop, payload } = await authenticate.webhook(request);
    processWebhook({ payload, shop });
    return new Response();
  } catch (error) {
    console.log("Error occurred on customers/create", error);
    return new Response();
  }
};
