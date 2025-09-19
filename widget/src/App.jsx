import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Widget, PricingPlan, Subscription } from "./sections";
import { toast } from "react-toastify";

const App = () => {
  const [customerData, setCustomerData] = useState(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  console.log('subscription: ', subscription);

  useEffect(() => {
    const selectors = [
      "#PRODUCT_BUILDER",
      "#PRODUCT_BUILDER_SUBSCRIPTIONS",
      "#WIDGET",
    ];

    let foundData = null;

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.getAttribute("data-customer")) {
        foundData = el.getAttribute("data-customer");
        break; 
      }
    }

    if (foundData) {
      try {
        setCustomerData(JSON.parse(foundData));
      } catch (error) {
        console.error("Error parsing customer data:", error);
      }
    }
  }, []);

  const fetchSubscriptionHandler = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/apps/public/api/v1/public/seal-subscription/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId: customerData?.id }),
        }
      );

      const data = await response.json();
      const { success, error, message, subscription } = data;

      if (!success && error) {
        toast.error(error);
        setShow(false);
        setSubscription(null);
      } else if (success && subscription) {
        if(subscription?.status == "ACTIVE"){
          setShow(true);
          toast.success(message || "Subscription found");
        }
        setSubscription(subscription);
      }

    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  }, [customerData?.id]);

  useEffect(() => {
    if (customerData?.id) {
      fetchSubscriptionHandler();
    }
  }, [customerData?.id, fetchSubscriptionHandler]);

  const subscriptionRoot = document.querySelector("#PRODUCT_BUILDER_SUBSCRIPTIONS");
  const widgetRoot = document.querySelector("#WIDGET");

  return (
    <>
      {subscriptionRoot &&
        createPortal(
          <Subscription
            loading={loading}
            subscription={subscription}
            customer={customerData}
          />,
          subscriptionRoot
        )}

      {widgetRoot &&
        createPortal(
          customerData?.id && show ? (
            <Widget customer_id={customerData?.id} />
          ) : (
            <PricingPlan />
          ),
          widgetRoot
        )}
    </>
  );
};

export default App;
