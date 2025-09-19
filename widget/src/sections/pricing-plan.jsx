const PricingPlan = () => {
  const fetchSellingPlan = async (product_id) => {
    try {
      const response = await fetch(
        `/apps/public/api/v1/public/selling-plan/?product_id=${product_id}`,
        {
          method: "GET",
        },
      );

      const responseData = await response.json();

      const { success, error, data } = responseData;

      if (!success && !data && error) {
        console.log(error);
      } else if (success && data && !error) {
        return data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const plans = [
    {
      plan_name: "Basic",
      plan_price: 19,
      plan_features: [
        "Limited access to essential features.",
        "Small storage capacity.",
        "Single-user access.",
      ],
      variant_id: "51898943668538",
      product_id: "10026740842810",
      group_id: "79123185978",
      name: "Deliver every month",
    },
    {
      plan_name: "Standard",
      plan_price: 39,
      plan_features: [
        "Access to all essential features.",
        "Moderate storage capacity.",
        "Multiple user access (e.g., 5 users).",
        "Priority email and chat support.",
      ],
      variant_id: "51898762592570",
      product_id: "10026643554618",
      group_id: "79123218746",
      name: "Deliver every year",
    },
  ];

  const handleAddToCart = async ({ product_id, group_id, variant_Id}) => {
    console.log("{ product_id, group_id, variant_Id }: ", {
      product_id,
      group_id,
      variant_Id,
    });
    const { product, sellingPlans } = await fetchSellingPlan(product_id);
    console.log("sellingPlans: ", sellingPlans);

    const filteredSellingPlan = sellingPlans.filter(
      (e) => String(e?.groupId) === String(group_id),
    )[0];

    console.log(filteredSellingPlan, "filteredSellingPlan");

    if (product && sellingPlans && fetchSellingPlan) {
      const url = `/products/${product?.handle}?selling_plan=${filteredSellingPlan?.id}&variant=${variant_Id}`;
      console.log("url: ", url);
      window.location.href = url;
    }
  };

  return (
    <>
      <div className="plan_container">
        {plans?.map((plan) => (
          <div className="card">
            <div>
              <h5>{plan?.plan_name}</h5>
              <h3>{plan?.plan_price}</h3>
              <ul>
                {plan?.plan_features?.map((feature) => (
                  <li>{feature}</li>
                ))}
              </ul>
            </div>
            <div>
              <button
                onClick={() =>
                  handleAddToCart({
                    product_id: plan?.product_id,
                    group_id: plan?.group_id,
                    variant_Id: plan?.variant_id,
                    name: plan?.name
                  })
                }
              >
                Subscribe
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PricingPlan;
