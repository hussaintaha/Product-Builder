import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Widget, PricingPlan, Subscription } from "./sections";
import ProfessionalPreloader from "./components/ProfessionalPreloader";
import { useCustomerData } from "./hooks/useCustomerData";
import { useSubscription } from "./hooks/useSubscription";
import { SELECTORS } from "./constant/subscription";

const App = () => {
  const customerData = useCustomerData();
  const [initialized, setInitialized] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  const {
    subscription,
    showWidget,
    loading,
    error,
    initializePolling,
    stopPolling,
    isExpired,
    hasRemainingAttempts,
    maxAttemptsReached,
    statusConfirmed,
  } = useSubscription(customerData?.id);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (customerData?.id && initialized) {
      console.log("Initializing subscription polling for customer:", customerData.id);
      initializePolling();
    }
  }, [customerData?.id, initialized, initializePolling]);

  useEffect(() => {
    if (!initialized) {
      setShowContent(false);
      return;
    }

    if (statusConfirmed() || maxAttemptsReached()) {
      console.log("Status confirmed or max attempts reached, showing content");
      setShowContent(true);
      return;
    }

    if (loading && !maxAttemptsReached() && !statusConfirmed()) {
      console.log("Still loading subscription...");
      setShowContent(false);
      return;
    }

    if (!customerData?.id) {
      console.log("No customer ID, showing pricing plan");
      setShowContent(true);
      return;
    }

    if (subscription) {
      if (isExpired() || !hasRemainingAttempts()) {
        console.log("Subscription expired or no attempts left, showing pricing plan");
        setShowContent(true);
      } else if (showWidget) {
        console.log("Subscription valid, showing widget");
        setShowContent(true);
      } else {
        console.log("Subscription check completed but conditions not met, showing pricing plan");
        setShowContent(true);
      }
    } else if (error) {
      console.log("Subscription error, showing pricing plan as fallback");
      setShowContent(true);
    } else {
      console.log("No subscription data available, showing pricing plan");
      setShowContent(true);
    }

  }, [
    initialized, 
    loading, 
    customerData, 
    subscription, 
    showWidget, 
    isExpired, 
    hasRemainingAttempts, 
    maxAttemptsReached, 
    error, 
    statusConfirmed
  ]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const subscriptionRoot = document.querySelector(SELECTORS.SUBSCRIPTION_ROOT);
  const widgetRoot = document.querySelector(SELECTORS.WIDGET_ROOT);

  const renderContent = () => {
    if (!initialized || !showContent) {
      return <ProfessionalPreloader />;
    }

    if (!customerData?.id) {
      return <PricingPlan />;
    }

    if (maxAttemptsReached() || statusConfirmed()) {
      if (subscription && showWidget && hasRemainingAttempts() && !isExpired()) {
        return <Widget customer_id={customerData.id} />;
      }
      return <PricingPlan customer_id={customerData.id} />;
    }

    if (subscription && showWidget && hasRemainingAttempts() && !isExpired()) {
      return <Widget customer_id={customerData.id} />;
    }

    return <PricingPlan customer_id={customerData.id} />;
  };

  useEffect(() => {
    if (initialized) {
      console.log("=== APP STATE DEBUG ===");
      console.log("Initialized:", initialized);
      console.log("Show Content:", showContent);
      console.log("Customer Data:", customerData);
      console.log("Loading:", loading);
      console.log("Subscription:", subscription);
      console.log("Show Widget:", showWidget);
      console.log("Has Remaining Attempts:", hasRemainingAttempts());
      console.log("Is Expired:", isExpired());
      console.log("Max Attempts Reached:", maxAttemptsReached());
      console.log("Status Confirmed:", statusConfirmed());
      console.log("Error:", error);
      console.log("======================");
    }
  }, [initialized, showContent, customerData, loading, subscription, showWidget, hasRemainingAttempts, isExpired, maxAttemptsReached, statusConfirmed, error]);

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