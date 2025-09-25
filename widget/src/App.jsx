import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Widget, PricingPlan, Subscription } from "./sections";
import ProfessionalPreloader from "./components/ProfessionalPreloader";
import { useCustomerData } from "./hooks/useCustomerData";
import { useSubscription } from "./hooks/useSubscription";
import { SELECTORS } from "./constants/subscription";

const App = () => {
  const customerData = useCustomerData();
  const [initialized, setInitialized] = useState(false);
  const {
    subscription,
    showWidget,
    loading,
    initializePolling,
    stopPolling,
    isExpired,
    maxAttemptsReached, // NEW: Get max attempts status
  } = useSubscription(customerData?.id);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (customerData?.id && initialized && !maxAttemptsReached()) {
      initializePolling();
    }
  }, [customerData?.id, initialized, initializePolling, maxAttemptsReached]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const subscriptionRoot = document.querySelector(SELECTORS.SUBSCRIPTION_ROOT);
  const widgetRoot = document.querySelector(SELECTORS.WIDGET_ROOT);

  const renderWidgetContent = () => {
    if (!initialized) {
      return <ProfessionalPreloader />;
    }

    if (customerData?.id && loading && !maxAttemptsReached()) {
      return <ProfessionalPreloader />;
    }

    if (!customerData?.id) {
      return <PricingPlan />;
    }

    if (isExpired() || !subscription || maxAttemptsReached()) {
      return <PricingPlan customer_id={customerData.id} />;
    }

    if (showWidget) {
      return <Widget customer_id={customerData.id} />;
    }

    return <PricingPlan customer_id={customerData.id} />;
  };

  return (
    <>
      {subscriptionRoot &&
        createPortal(
          <Subscription customer={customerData} />,
          subscriptionRoot,
        )}

      {widgetRoot && createPortal(renderWidgetContent(), widgetRoot)}
    </>
  );
};

export default App;