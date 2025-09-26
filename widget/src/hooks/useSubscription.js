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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollingIntervalRef = useRef(null);
  const pollingAttemptsRef = useRef(0);
  const maxAttemptsReachedRef = useRef(false);
  const statusConfirmedRef = useRef(false); 
  const toastShownRef = useRef(false);

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

  const shouldContinuePolling = useCallback(
    (subscriptionData) => {
      // If status is already confirmed, don't continue polling
      if (statusConfirmedRef.current) return false;

      // If we have valid subscription data, we can confirm status
      if (subscriptionData && subscriptionData.subscription_status) {
        // For active subscriptions with remaining attempts, we can stop polling
        if (
          subscriptionData.subscription_status === SUBSCRIPTION_STATUS.ACTIVE &&
          hasRemainingAttempts(subscriptionData)
        ) {
          return false;
        }

        // For expired or invalid subscriptions, we can also stop polling
        if (
          isSubscriptionExpired(subscriptionData) ||
          subscriptionData.subscription_status !== SUBSCRIPTION_STATUS.ACTIVE
        ) {
          return false;
        }
      }

      // Continue polling if we don't have definitive status yet
      return true;
    },
    [hasRemainingAttempts, isSubscriptionExpired],
  );

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollingAttemptsRef.current = 0;
  }, []);

  const resetPollingAttempts = useCallback(() => {
    maxAttemptsReachedRef.current = false;
    pollingAttemptsRef.current = 0;
    statusConfirmedRef.current = false; // Reset status confirmation
    toastShownRef.current = false;
  }, []);

  const startPolling = useCallback(
    (interval, fetchFunction) => {
      if (maxAttemptsReachedRef.current || statusConfirmedRef.current) {
        console.log(
          "Polling blocked: maximum attempts reached or status confirmed",
        );
        return;
      }

      stopPolling();

      pollingIntervalRef.current = setInterval(() => {
        pollingAttemptsRef.current += 1;

        // Stop if max attempts reached
        if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
          stopPolling();
          maxAttemptsReachedRef.current = true;

          if (!toastShownRef.current) {
            toast.error("Unable to verify subscription status. Please try again later.");
            toastShownRef.current = true; // Mark toast as shown
          }

          console.log(
            "Max polling attempts reached - polling stopped permanently",
          );
          return;
        }

        fetchFunction();
      }, interval);
    },
    [stopPolling],
  );

  const determinePollingInterval = useCallback(
    (subscriptionData) => {
      if (!subscriptionData) return POLLING_INTERVALS.ERROR;

      if (isSubscriptionExpired(subscriptionData)) {
        return POLLING_INTERVALS.EXPIRED;
      }

      if (hasRemainingAttempts(subscriptionData)) {
        return POLLING_INTERVALS.ACTIVE;
      }

      return POLLING_INTERVALS.ERROR;
    },
    [isSubscriptionExpired, hasRemainingAttempts],
  );

  const fetchSubscription = useCallback(async () => {
    if (maxAttemptsReachedRef.current || statusConfirmedRef.current) {
      console.log(
        "Fetch blocked: maximum polling attempts reached or status confirmed",
      );
      return;
    }

    if (!customerId) return;

    try {
      setLoading(true);
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
        setSubscription(subscriptionData);
        setError(null);

        const shouldShowWidget = hasRemainingAttempts(subscriptionData);
        setShowWidget(shouldShowWidget);

        // Check if we should continue polling or stop
        const continuePolling = shouldContinuePolling(subscriptionData);

        if (!continuePolling) {
          // Status is confirmed - stop polling permanently
          statusConfirmedRef.current = true;
          stopPolling();
          console.log("Subscription status confirmed - polling stopped");
        } else {
          // Continue polling with appropriate interval
          const pollingInterval = determinePollingInterval(subscriptionData);
          startPolling(pollingInterval, fetchSubscription);
        }

        if (isSubscriptionExpired(subscriptionData)) {
          toast.error(
            `Your ${subscriptionData?.subscribe_plan_name || "subscription"} has expired. Please upgrade or renew your plan.`,
          );
        }
      } else {
        setShowWidget(false);
        setSubscription(null);

        // If we get an empty response but have reached max attempts, stop
        if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
          // Stop a bit earlier for empty responses
          statusConfirmedRef.current = true;
          stopPolling();
        }
      }
    } catch (error) {
      console.error("Subscription fetch error:", error);
      setError(error.message);
      setShowWidget(false);

      // Only continue polling if we haven't confirmed status and haven't reached max attempts
      if (!statusConfirmedRef.current && !maxAttemptsReachedRef.current) {
        startPolling(POLLING_INTERVALS.ERROR, fetchSubscription);
      }
    } finally {
      setLoading(false);
    }
  }, [
    customerId,
    hasRemainingAttempts,
    isSubscriptionExpired,
    shouldContinuePolling,
    startPolling,
    stopPolling,
    determinePollingInterval,
  ]);

  const initializePolling = useCallback(() => {
    if (!customerId) return;

    resetPollingAttempts();
    stopPolling();

    startPolling(POLLING_INTERVALS.INITIAL, fetchSubscription);
  }, [
    customerId,
    stopPolling,
    startPolling,
    fetchSubscription,
    resetPollingAttempts,
  ]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    subscription,
    showWidget,
    loading,
    error,
    fetchSubscription,
    initializePolling,
    stopPolling,
    resetPollingAttempts,
    hasRemainingAttempts: () => hasRemainingAttempts(subscription),
    isExpired: () => isSubscriptionExpired(subscription),
    maxAttemptsReached: () => maxAttemptsReachedRef.current,
    statusConfirmed: () => statusConfirmedRef.current, // NEW: Expose status confirmation
  };
};
