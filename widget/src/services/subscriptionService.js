import { API_ENDPOINTS, PLAN_TYPES, SUBSCRIPTION_STATUS } from '../constant/subscription';

class SubscriptionService {
  async checkSubscriptionStatus(customerId) {
    if (!customerId) throw new Error('Customer ID is required');

    const response = await fetch(API_ENDPOINTS.SUBSCRIPTION_STATUS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  validateSubscriptionAccess(subscriptionData) {
    if (!subscriptionData) return false;
    
    const { subscription_status, subscribe_plan_name, actual_attempts, used_attempt } = subscriptionData;
    
    if (subscription_status !== SUBSCRIPTION_STATUS.ACTIVE) return false;
    
    if (subscribe_plan_name === PLAN_TYPES.FREE) {
      return Number(actual_attempts) > Number(used_attempt);
    }
    
    return true;
  }
}

export const subscriptionService = new SubscriptionService();