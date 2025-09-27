import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Widget, PricingPlan, Subscription } from "./sections";
import ProfessionalPreloader from "./components/ProfessionalPreloader";
import { useCustomerData } from "./hooks/useCustomerData";
import { useSubscription } from "./hooks/useSubscription";
import { SELECTORS } from "./constant/subscription";

const App = () => {
  const customerData = useCustomerData();
  const [initialized, setInitialized] = useState(false);
  const pollingInitializedRef = useRef(false);

  const {
    subscription,
    showWidget,
    loading,
    initializePolling,
    stopPolling,
    isExpired,
    hasRemainingAttempts,
    maxAttemptsReached, // This is a value, not a function
    statusConfirmed,    // This is a value, not a function
    pollingAttempts,    // This is a value, not a function
  } = useSubscription(customerData?.id);

  // Initialize app after 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Start polling only once when customer data and app are initialized
  useEffect(() => {
    if (customerData?.id && initialized && !pollingInitializedRef.current) {
      console.log("🔄 Starting polling process...");
      pollingInitializedRef.current = true;
      initializePolling();
    }
  }, [customerData?.id, initialized, initializePolling]);

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const subscriptionRoot = document.querySelector(SELECTORS.SUBSCRIPTION_ROOT);
  const widgetRoot = document.querySelector(SELECTORS.WIDGET_ROOT);

  // Determine what content to render
  const renderContent = () => {
    // Show preloader until polling is complete
    const shouldShowLoader = !initialized || 
                            (loading && !maxAttemptsReached && !statusConfirmed);
    
    if (shouldShowLoader) {
      return <ProfessionalPreloader />;
    }

    // After polling completes, show appropriate content
    if (subscription && showWidget && hasRemainingAttempts() && !isExpired()) {
      console.log("✅ Showing Widget - Valid subscription");
      return <Widget customer_id={customerData.id} />;
    }
    
    console.log("💰 Showing Pricing Plan - Subscription needed");
    return <PricingPlan customer_id={customerData.id} />;
  };

  // Debug logging - only log when something changes
  useEffect(() => {
    if (initialized) {
      console.log("=== APP STATE DEBUG ===");
      console.log("Initialized:", initialized);
      console.log("Polling Attempts:", pollingAttempts);
      console.log("Loading:", loading);
      console.log("Max Attempts Reached:", maxAttemptsReached);
      console.log("Status Confirmed:", statusConfirmed);
      console.log("Show Widget:", showWidget);
      console.log("Has Remaining Attempts:", hasRemainingAttempts());
      console.log("Is Expired:", isExpired());
      console.log("======================");
    }
  }, [initialized, loading, maxAttemptsReached, statusConfirmed, showWidget, hasRemainingAttempts, isExpired, pollingAttempts]);

  return (
    <>
      {subscriptionRoot &&
        createPortal(
          <Subscription customer={customerData} />,
          subscriptionRoot,
        )}

      {widgetRoot && createPortal(renderContent(), widgetRoot)}
    </>
  );
};

export default App;