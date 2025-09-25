import { useState, useEffect } from 'react';
import { SELECTORS } from '../constants/subscription';

export const useCustomerData = () => {
  const [customerData, setCustomerData] = useState(null);

  useEffect(() => {
    const selectors = [SELECTORS.SUBSCRIPTION_ROOT, SELECTORS.WIDGET_ROOT];
    let foundData = null;

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el?.getAttribute('data-customer')) {
        foundData = el.getAttribute('data-customer');
        break;
      }
    }

    if (foundData) {
      try {
        setCustomerData(JSON.parse(foundData));
      } catch (error) {
        console.error('Error parsing customer data:', error);
      }
    }
  }, []);

  return customerData;
};