// useSubscription.js
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  API_ENDPOINTS,
  PLAN_TYPES,
  SUBSCRIPTION_STATUS,
  POLLING_INTERVALS,
  MAX_POLLING_ATTEMPTS,
} from "../constant/subscription";

export const useSubscription = (customerId) => {
  const [subscription, setSubscription] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pollingIntervalRef = useRef(null);
  const pollingAttemptsRef = useRef(0);
  const maxAttemptsReachedRef = useRef(false);
  const statusConfirmedRef = useRef(false); 
  const toastShownRef = useRef(false);
  const initializedRef = useRef(false);

  // Temporary storage for subscription data during polling
  const tempSubscriptionRef = useRef(null);
  const tempShowWidgetRef = useRef(false);

  // Check if subscription has remaining attempts
  const hasRemainingAttempts = useCallback((subscriptionData) => {
    if (!subscriptionData) return false;

    const {
      subscription_status,
      subscribe_plan_name,
      actual_attempts,
      used_attempt,
    } = subscriptionData;

    if (subscription_status === SUBSCRIPTION_STATUS.EXPIRED) {
      return false;
    }

    if (subscription_status !== SUBSCRIPTION_STATUS.ACTIVE) return false;

    if (subscribe_plan_name === PLAN_TYPES.FREE) {
      return Number(actual_attempts) > Number(used_attempt);
    }

    return true;
  }, []);

  // Check if subscription is expired
  const isSubscriptionExpired = useCallback((subscriptionData) => {
    if (!subscriptionData) return true;

    const {
      subscription_status,
      subscribe_plan_name,
      actual_attempts,
      used_attempt,
    } = subscriptionData;

    if (subscription_status === SUBSCRIPTION_STATUS.EXPIRED) {
      return true;
    }

    if (
      subscribe_plan_name === PLAN_TYPES.FREE &&
      subscription_status === SUBSCRIPTION_STATUS.ACTIVE &&
      Number(actual_attempts) <= Number(used_attempt)
    ) {
      return true;
    }

    return false;
  }, []);

  // Stop polling and clear interval
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Reset all polling attempts and flags
  const resetPollingAttempts = useCallback(() => {
    maxAttemptsReachedRef.current = false;
    pollingAttemptsRef.current = 0;
    statusConfirmedRef.current = false;
    toastShownRef.current = false;
    initializedRef.current = false;
    tempSubscriptionRef.current = null;
    tempShowWidgetRef.current = false;
    setLoading(true);
    setSubscription(null);
    setShowWidget(false);
    setError(null);
  }, []);

  // Finalize status after polling completes
  const finalizeStatus = useCallback(() => {
    if (tempSubscriptionRef.current) {
      setSubscription(tempSubscriptionRef.current);
      setShowWidget(tempShowWidgetRef.current);
      statusConfirmedRef.current = true;
      
      if (!toastShownRef.current) {
        if (tempShowWidgetRef.current) {
          toast.success("Subscription verified successfully!");
        } else {
          toast.info("Subscription status confirmed.");
        }
        toastShownRef.current = true;
      }
      console.log("✅ Final status set after 20 polling attempts");
    } else {
      setShowWidget(false);
      setSubscription(null);
      if (!toastShownRef.current) {
        toast.info("No active subscription found after 20 attempts.");
        toastShownRef.current = true;
      }
    }
    
    setLoading(false);
    maxAttemptsReachedRef.current = true;
  }, []);

  // Fetch subscription data - DON'T SET STATUS UNTIL MAX REACHED
  const fetchSubscription = useCallback(async () => {
    // Block fetch if max attempts reached
    if (maxAttemptsReachedRef.current) {
      console.log("Fetch blocked: maximum polling attempts reached");
      stopPolling();
      return;
    }

    if (!customerId) {
      setLoading(false);
      stopPolling();
      return;
    }

    try {
      setError(null);

      const response = await fetch(API_ENDPOINTS.SUBSCRIPTION_STATUS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Subscription check failed");
      }

      const { success, subscription: subscriptionData } = data;

      if (success && subscriptionData) {
        // Store data temporarily but don't set state until max attempts
        tempSubscriptionRef.current = subscriptionData;
        tempShowWidgetRef.current = hasRemainingAttempts(subscriptionData);

        // Increment attempt counter
        pollingAttemptsRef.current += 1;
        console.log(`Polling attempt ${pollingAttemptsRef.current} of ${MAX_POLLING_ATTEMPTS}`);

        // Check if we've reached max attempts (20) - ONLY THEN SET STATUS
        if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
          stopPolling();
          finalizeStatus();
          console.log("Max polling attempts reached (20) - final status set");
        }

      } else {
        // Increment attempt counter for failed responses
        pollingAttemptsRef.current += 1;
        console.log(`Polling attempt ${pollingAttemptsRef.current} of ${MAX_POLLING_ATTEMPTS}`);

        // Stop after max attempts even if no subscription found
        if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
          stopPolling();
          finalizeStatus();
        }
      }
    } catch (error) {
      console.error("Subscription fetch error:", error);
      setError(error.message);
      
      // Increment attempt counter for errors
      pollingAttemptsRef.current += 1;
      console.log(`Polling attempt ${pollingAttemptsRef.current} of ${MAX_POLLING_ATTEMPTS}`);

      // Stop after max attempts on errors
      if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
        stopPolling();
        finalizeStatus();
      }
    }
  }, [customerId, hasRemainingAttempts, stopPolling, finalizeStatus]);

  // Initialize polling when customer data is available
  const initializePolling = useCallback(() => {
    // Prevent multiple initializations
    if (initializedRef.current || !customerId) {
      return;
    }

    console.log("🚀 Initializing polling for 20 attempts for customer:", customerId);
    initializedRef.current = true;
    resetPollingAttempts();
    stopPolling();

    // Start the polling process
    const startPollingProcess = () => {
      if (maxAttemptsReachedRef.current) {
        return;
      }

      // Execute the fetch
      fetchSubscription();

      // Schedule next poll if we haven't reached max attempts
      if (pollingAttemptsRef.current < MAX_POLLING_ATTEMPTS) {
        const nextInterval = pollingAttemptsRef.current === 0 ? 
          POLLING_INTERVALS.INITIAL : POLLING_INTERVALS.ACTIVE;
        
        pollingIntervalRef.current = setTimeout(startPollingProcess, nextInterval);
      }
    };

    // Start the first poll immediately
    startPollingProcess();
  }, [customerId, stopPolling, fetchSubscription, resetPollingAttempts]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    subscription,
    showWidget,
    loading: loading && !maxAttemptsReachedRef.current,
    error,
    fetchSubscription,
    initializePolling,
    stopPolling,
    resetPollingAttempts,
    hasRemainingAttempts: () => hasRemainingAttempts(subscription),
    isExpired: () => isSubscriptionExpired(subscription),
    maxAttemptsReached: maxAttemptsReachedRef.current,
    statusConfirmed: statusConfirmedRef.current,
    pollingAttempts: pollingAttemptsRef.current,
  };
};