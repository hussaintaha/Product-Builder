// subscription.js
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
};

export const PLAN_TYPES = {
  FREE: 'Free',
  GROWTH: 'Growth',
  PRO: 'Pro',
  STARTER: 'Starter'
};

export const API_ENDPOINTS = {
  SUBSCRIPTION_STATUS: '/apps/public/api/v1/public/seal-subscription/status',
  BASE_URL: 'https://e04e1f45-ddfa-4cfd-aa2c-825ae20bc005-00-4q1rcyndehbs.kirk.replit.dev/api/customers'
};

export const SELECTORS = {
  SUBSCRIPTION_ROOT: '#PRODUCT_BUILDER_SUBSCRIPTIONS',
  WIDGET_ROOT: '#WIDGET'
};

export const POLLING_INTERVALS = {
  INITIAL: 500,       
  ACTIVE: 5000,      
  ERROR: 3000             
};

export const MAX_POLLING_ATTEMPTS = 20; // Changed from 8 to 20
export const POLLING_INTERVAL = 500;