import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_ENDPOINTS, PLAN_TYPES, SUBSCRIPTION_STATUS, POLLING_INTERVALS, MAX_POLLING_ATTEMPTS } from '../constants/subscription';

export const useSubscription = (customerId) => {
  const [subscription, setSubscription] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  

  const pollingIntervalRef = useRef(null);
  const pollingAttemptsRef = useRef(0);
  const maxAttemptsReachedRef = useRef(false);

  const hasRemainingAttempts = useCallback((subscriptionData) => {
    if (!subscriptionData) return false;
    
    const { subscription_status, subscribe_plan_name, actual_attempts, used_attempt } = subscriptionData;
    
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
    
    const { subscription_status, subscribe_plan_name, actual_attempts, used_attempt } = subscriptionData;
    
    if (subscription_status === SUBSCRIPTION_STATUS.EXPIRED) {
      return true;
    }
    
    if (subscribe_plan_name === PLAN_TYPES.FREE && 
        subscription_status === SUBSCRIPTION_STATUS.ACTIVE && 
        Number(actual_attempts) <= Number(used_attempt)) {
      return true;
    }
    
    return false;
  }, []);

  const determinePollingInterval = useCallback((subscriptionData) => {
    if (!subscriptionData) return POLLING_INTERVALS.ERROR;
    
    if (isSubscriptionExpired(subscriptionData)) {
      return POLLING_INTERVALS.EXPIRED;
    }
    
    if (hasRemainingAttempts(subscriptionData)) {
      return POLLING_INTERVALS.ACTIVE;
    }
    
    return POLLING_INTERVALS.ERROR;
  }, [isSubscriptionExpired, hasRemainingAttempts]);

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
  }, []);

  const startPolling = useCallback((interval, fetchFunction) => {
    if (maxAttemptsReachedRef.current) {
      console.log('Polling blocked: maximum attempts already reached');
      return;
    }
    
    stopPolling();
    
    pollingIntervalRef.current = setInterval(() => {
      pollingAttemptsRef.current += 1;
      

      if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
        stopPolling();
        maxAttemptsReachedRef.current = true; 
        console.log('Max polling attempts reached - polling stopped permanently');
        return;
      }
      
      fetchFunction();
    }, interval);
  }, [stopPolling]);

  const fetchSubscription = useCallback(async () => {

    if (maxAttemptsReachedRef.current) {
      console.log('Fetch blocked: maximum polling attempts reached');
      return;
    }

    if (!customerId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.SUBSCRIPTION_STATUS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Subscription check failed');
      }

      const { success, subscription: subscriptionData } = data;

      if (success && subscriptionData) {
        setSubscription(subscriptionData);
        setError(null);
        
        const shouldShowWidget = hasRemainingAttempts(subscriptionData);
        setShowWidget(shouldShowWidget);
        

        const pollingInterval = determinePollingInterval(subscriptionData);
        

        if (subscriptionData.subscription_status && !maxAttemptsReachedRef.current) {
          startPolling(pollingInterval, fetchSubscription);
        }
        

        if (isSubscriptionExpired(subscriptionData)) {
          toast.error(
            `Your ${subscriptionData?.subscribe_plan_name || 'subscription'} has expired. Please upgrade or renew your plan.`
          );
        }
      } else {
        setShowWidget(false);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Subscription fetch error:', error);
      setError(error.message);
      setShowWidget(false);
      

      if (!maxAttemptsReachedRef.current) {
        startPolling(POLLING_INTERVALS.ERROR, fetchSubscription);
      }
    } finally {
      setLoading(false);
    }
  }, [customerId, hasRemainingAttempts, isSubscriptionExpired, determinePollingInterval, startPolling]);


  const initializePolling = useCallback(() => {
    if (!customerId) return;
    

    resetPollingAttempts();
    stopPolling(); 
    

    startPolling(POLLING_INTERVALS.INITIAL, fetchSubscription);
  }, [customerId, stopPolling, startPolling, fetchSubscription, resetPollingAttempts]);


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
    maxAttemptsReached: () => maxAttemptsReachedRef.current 
  };
};