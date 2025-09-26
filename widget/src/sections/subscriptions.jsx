import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

// Pricing plans data (same as in PricingPlan component)
const pricingPlans = [
  {
    tier: "Starter",
    price: 19,
    currency: "USD",
    billingCycle: "month",
    purpose:
      "For first-time founders who just need help structuring their idea into a usable PRD.",
    features: [
      "Guided Problem Definition",
      "AI powered root cause exploration",
      "Customer Persona builder",
      "Use Case Generator",
      "PRD Generator",
      "Access to Help and Glossary",
      "Limited exports (PDF/Doc)",
    ],
    variant_id: "51921658839354",
    product_id: "10031957508410",
    group_id: "79129248058",
  },
  {
    tier: "Growth",
    price: 49,
    currency: "USD",
    billingCycle: "month",
    purpose:
      "For founders ready to take their PRD and plan their Go-To-Market (GTM) strategy.",
    features: [
      "Everything in Starter",
      "GTM Strategy Builder",
      "Target Market",
      "Value Proposition",
      "Positioning",
      "Messaging",
      "Pricing Strategy",
      "Distribution Channels",
      "Implementation Phases",
      "Success Metrics",
    ],
    popular: true,
    variant_id: "51921665753402",
    product_id: "10031959441722",
    group_id: "79129280826",
  },
  {
    tier: "Pro",
    price: 99,
    currency: "USD",
    billingCycle: "month",
    purpose:
      "For founders (and accelerators/VCs) who want to de-risk products with structured Problem–Solution Validation.",
    features: [
      "Everything in Growth",
      "Problem Definition & Validation",
      "Solution-Market fit Analysis",
      "Customer Validation Summary",
      "Competitive Gap Analysis",
      "Risk Assessment",
      "Validation Conclusion",
      "Next Steps",
    ],
    variant_id: "51921671094586",
    product_id: "10031960686906",
    group_id: "79129313594",
  },
];

const Subscriptions = ({ customer }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const fetchSubscriptionHandler = useCallback(async () => {
    if (!customer?.id) return;

    setLoading(true);
    let finalResult = null;

    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(
            `/apps/public/api/v1/public/seal-subscription/status`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ customerId: customer.id }),
            },
          );

          const data = await response.json();
          const { success, subscription } = data;

          console.log(`Subscription Attempt ${attempt}:`, data);

          if (success && subscription) {
            finalResult = data;
            break;
          }
        } catch (err) {
          console.error(`Attempt ${attempt} failed:`, err);
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    } finally {
      if (finalResult?.success && finalResult.subscription) {
        setSubscription(finalResult.subscription);
        if (finalResult.subscription.subscription_status === "active") {
          toast.success(finalResult.message || "Subscription found", {
            position: "top-center",
            progress: true,
          });
        }
      } else {
        setSubscription(null);
        toast.error("Your subscription has expired. Please renew or upgrade.");
      }
      setLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => {
    if (customer?.id) {
      fetchSubscriptionHandler();
    }
  }, [customer?.id, fetchSubscriptionHandler]);

  useEffect(() => {
    // Add hover effects dynamically on mount
    const style = document.createElement("style");
    style.textContent = `
      .pause-btn:hover:not(:disabled) {
        background-color: #ca8a04 !important;
        transform: translateY(-1px);
      }
      .cancel-btn:hover:not(:disabled) {
        background-color: #b91c1c !important;
        transform: translateY(-1px);
      }
      .activate-btn:hover:not(:disabled) {
        background-color: #15803d !important;
        transform: translateY(-1px);
      }
      .back-btn:hover {
        background-color: #e5e7eb !important;
        transform: translateY(-1px);
      }
      .upgrade-plan-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        border-color: #3b82f6;
      }
      .upgrade-plan-btn:hover {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubscriptionManage = async (subscriptionId, action) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        "/apps/public/api/v1/public/seal-subscriptions-manage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subscriptionId, action }),
        },
      );

      const data = await response.json();
      const { success, error, message } = data;

      if (!success && error) {
        toast.error(error);
      } else if (success && !error && message) {
        toast.success(message);
      }

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(`Error ${action} subscription:`, error);
      toast.error(`Failed to ${action} subscription. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to get available upgrade plans based on current subscription
  const getUpgradePlans = (currentPlan) => {
    const currentPlanName =
      currentPlan?.subscribe_plan_name || currentPlan?.plan_name;

    if (!currentPlanName || currentPlanName === "Free") {
      return pricingPlans; // Show all plans for free users
    }

    switch (currentPlanName) {
      case "Starter":
        return pricingPlans.filter(
          (plan) => plan.tier === "Growth" || plan.tier === "Pro",
        );
      case "Growth":
        return pricingPlans.filter((plan) => plan.tier === "Pro");
      case "Pro":
        return []; // No upgrades available for Pro users
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="container" style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.loadingText}>Loading subscription...</div>
        </div>
      </div>
    );
  }

  const handleBackToAccount = () => {
    window.location.href = "/account";
  };

  // Check if it's a free plan
  const isFreeAccount =
    subscription?.plan_name === "Free" ||
    subscription?.subscription_plan_price === 0;
  const hasValidSubscriptionId =
    subscription?.subscription_id && subscription.subscription_id.trim() !== "";

  // Get available upgrade plans
  const upgradePlans = getUpgradePlans(subscription);

  return (
    <div className="container" style={styles.container}>
      {subscription && Object.keys(subscription).length > 0 ? (
        <div style={styles.subscriptionCard}>
          {/* Back Button */}
          <div style={styles.backButtonContainer}>
            <button
              onClick={handleBackToAccount}
              style={styles.backButton}
              className="back-btn"
            >
              <span style={styles.backArrow}>←</span>
              Back to Account
            </button>
          </div>

          {/* Header */}
          <div style={styles.header}>
            <h2 style={styles.title}>
              {isFreeAccount ? "Your Free Account" : "Your Subscription"}
            </h2>
            <div style={styles.statusContainer}>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor:
                    subscription.subscription_status === "active"
                      ? "#dcfce7"
                      : "#fed7d7",
                  color:
                    subscription.subscription_status === "active"
                      ? "#166534"
                      : "#9b2c2c",
                }}
              >
                <span
                  style={{
                    ...styles.statusDot,
                    backgroundColor:
                      subscription.subscription_status === "active"
                        ? "#22c55e"
                        : "#f56565",
                  }}
                ></span>
                {subscription.subscription_status}
              </span>
              {hasValidSubscriptionId && (
                <span style={styles.subscriptionId}>
                  ID: #{subscription.subscription_id}
                </span>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div style={styles.gridContainer}>
            {/* Customer Info */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Customer Details</h3>
              <div style={styles.infoContent}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Name: </span>
                  <span style={styles.value}>
                    {subscription.first_name} {subscription.last_name}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Email: </span>
                  <span style={styles.value}>{subscription.email}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Customer ID: </span>
                  <span style={styles.customerIdValue}>
                    {subscription.customer_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Details */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Plan Details</h3>
              <div style={styles.infoContent}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Plan: </span>
                  <span style={styles.value}>
                    {subscription.subscribe_plan_name || subscription.plan_name}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Price: </span>
                  <span style={styles.priceValue}>
                    $
                    {parseFloat(
                      subscription.subscription_plan_price || 0,
                    ).toFixed(2)}
                  </span>
                </div>
                {subscription.subscription_interval && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Billing Cycle: </span>
                    <span style={styles.value}>
                      {subscription.subscription_interval}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Summary */}
          <div style={styles.pricingSummary}>
            <h3 style={styles.cardTitle}>Usage Summary</h3>
            <div style={styles.pricingGrid}>
              <div style={styles.pricingItem}>
                <div style={styles.pricingLabel}>Total Attempts</div>
                <div style={styles.originalPrice}>
                  {subscription.actual_attempts || 0}
                </div>
              </div>
              <div style={styles.pricingItem}>
                <div style={styles.pricingLabel}>Used Attempts</div>
                <div style={styles.discountPrice}>
                  {subscription.used_attempt || 0}
                </div>
              </div>
              <div style={styles.pricingItem}>
                <div style={styles.pricingLabel}>Remaining</div>
                <div style={styles.finalPrice}>
                  {(subscription.actual_attempts || 0) -
                    (subscription.used_attempt || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Plans Section */}
          {upgradePlans.length > 0 && (
            <div style={styles.upgradeSection}>
              <h3 style={styles.upgradeSectionTitle}>
                {isFreeAccount ? "Available Plans" : "Upgrade Your Plan"}
              </h3>
              <p style={styles.upgradeSectionSubtitle}>
                {isFreeAccount
                  ? "Choose a plan to unlock premium features"
                  : "Get access to more features and increase your limits"}
              </p>
              <div style={styles.upgradeGrid}>
                {upgradePlans.map((plan) => (
                  <div
                    key={plan.tier}
                    style={styles.upgradePlanCard}
                    className="upgrade-plan-card"
                  >
                    <div style={styles.upgradePlanHeader}>
                      <h4 style={styles.upgradePlanTier}>{plan.tier}</h4>
                      <div style={styles.upgradePlanPrice}>
                        <span style={styles.upgradePriceCurrency}>$</span>
                        <span style={styles.upgradePriceAmount}>
                          {plan.price}
                        </span>
                        <span style={styles.upgradePriceCycle}>
                          /{plan.billingCycle}
                        </span>
                      </div>
                      <p style={styles.upgradePlanPurpose}>{plan.purpose}</p>
                    </div>

                    <ul style={styles.upgradeFeaturesList}>
                      {plan.features.slice(0, 5).map((feature, index) => (
                        <li key={index} style={styles.upgradeFeatureItem}>
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li style={styles.upgradeFeatureMore}>
                          +{plan.features.length - 5} more features
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons - Only show for paid subscriptions with valid subscription ID */}
          {!isFreeAccount && hasValidSubscriptionId && (
            <div style={styles.buttonContainer}>
              {subscription.subscription_status === "paused" ? (
                <>
                  {/* Resume Button */}
                  <button
                    onClick={() =>
                      handleSubscriptionManage(
                        subscription.subscription_id,
                        "resume",
                      )
                    }
                    disabled={isProcessing}
                    className="activate-btn"
                    style={{
                      ...styles.button,
                      ...styles.activateButton,
                      ...(isProcessing ? styles.disabledButton : {}),
                    }}
                  >
                    {isProcessing ? "Processing..." : "Resume Subscription"}
                  </button>

                  {/* Cancel Button */}
                  <button
                    onClick={() =>
                      handleSubscriptionManage(
                        subscription.subscription_id,
                        "cancel",
                      )
                    }
                    disabled={isProcessing}
                    className="cancel-btn"
                    style={{
                      ...styles.button,
                      ...styles.cancelButton,
                      ...(isProcessing ? styles.disabledButton : {}),
                    }}
                  >
                    {isProcessing ? "Processing..." : "Cancel Subscription"}
                  </button>
                </>
              ) : subscription.subscription_status === "active" ? (
                <>
                  {/* Pause Button */}
                  <button
                    onClick={() =>
                      handleSubscriptionManage(
                        subscription.subscription_id,
                        "pause",
                      )
                    }
                    disabled={isProcessing}
                    className="pause-btn"
                    style={{
                      ...styles.button,
                      ...styles.pauseButton,
                      ...(isProcessing ? styles.disabledButton : {}),
                    }}
                  >
                    {isProcessing ? "Processing..." : "Pause Subscription"}
                  </button>

                  {/* Cancel Button */}
                  <button
                    onClick={() =>
                      handleSubscriptionManage(
                        subscription.subscription_id,
                        "cancel",
                      )
                    }
                    disabled={isProcessing}
                    className="cancel-btn"
                    style={{
                      ...styles.button,
                      ...styles.cancelButton,
                      ...(isProcessing ? styles.disabledButton : {}),
                    }}
                  >
                    {isProcessing ? "Processing..." : "Cancel Subscription"}
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* Help Text */}
          <div style={styles.helpText}>
            <div style={styles.helpContent}>
              <strong>Note:</strong>{" "}
              {isFreeAccount &&
                "You are currently on a free plan. Upgrade to a paid subscription to access premium features and increased usage limits."}
              {!isFreeAccount &&
                subscription.subscription_status === "active" &&
                hasValidSubscriptionId &&
                "Pausing your subscription will temporarily stop billing and deliveries. You can resume anytime. Canceling will permanently end your subscription."}
              {!isFreeAccount &&
                subscription.subscription_status === "paused" &&
                "Your subscription is currently paused. Reactivate to resume billing and deliveries, or cancel to permanently end your subscription."}
              {!isFreeAccount &&
                subscription.subscription_status === "cancelled" &&
                "Your subscription has been cancelled. You can reactivate it to resume your subscription benefits."}
              {!isFreeAccount &&
                !hasValidSubscriptionId &&
                "Subscription management is not available at this time. Please contact support if you need assistance."}
            </div>
          </div>

          {/* Fallback Upgrade CTA for Free Users (if no plans shown above) */}
          {isFreeAccount && upgradePlans.length === 0 && (
            <div style={styles.upgradeSection}>
              <button
                onClick={() => (window.location.href = "/pricing")}
                style={styles.upgradeButton}
              >
                View All Plans
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.noSubscription}>
          <div style={styles.noSubscriptionTitle}>No subscription found</div>
          <p style={styles.noSubscriptionText}>
            You don't have any subscription information available at the moment.
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "24px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "128px",
  },
  loadingText: {
    fontSize: "18px",
    color: "#666",
  },
  subscriptionCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    padding: "24px",
    border: "1px solid #e5e7eb",
  },
  header: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "16px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginRight: "8px",
  },
  subscriptionId: {
    color: "#6b7280",
    fontSize: "14px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  infoCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 12px 0",
  },
  infoContent: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoRow: {
    fontSize: "14px",
  },
  label: {
    color: "#6b7280",
  },
  value: {
    fontWeight: "500",
    color: "#1f2937",
  },
  customerIdValue: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#1f2937",
  },
  priceValue: {
    fontWeight: "500",
    color: "#059669",
  },
  pricingSummary: {
    backgroundColor: "#eff6ff",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "16px",
  },
  pricingItem: {
    textAlign: "center",
  },
  pricingLabel: {
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "4px",
  },
  originalPrice: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
  },
  discountPrice: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#dc2626",
  },
  finalPrice: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#059669",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  button: {
    flex: 1,
    fontWeight: "600",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease-in-out",
    minHeight: "48px",
  },
  pauseButton: {
    backgroundColor: "#eab308",
    color: "#ffffff",
  },
  cancelButton: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
  },
  activateButton: {
    backgroundColor: "#16a34a",
    color: "#ffffff",
  },
  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  helpText: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  helpContent: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.5",
  },
  noSubscription: {
    textAlign: "center",
    padding: "48px 0",
  },
  noSubscriptionTitle: {
    color: "#6b7280",
    fontSize: "18px",
    marginBottom: "8px",
  },
  noSubscriptionText: {
    color: "#9ca3af",
    margin: 0,
  },
  backButtonContainer: {
    marginBottom: "20px",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    textDecoration: "none",
  },
  backArrow: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  upgradeSection: {
    marginTop: "24px",
    padding: "20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  upgradeSectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 8px 0",
    textAlign: "center",
  },
  upgradeSectionSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    textAlign: "center",
    margin: "0 0 20px 0",
  },
  upgradeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  upgradePlanCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  upgradePlanHeader: {
    marginBottom: "16px",
  },
  upgradePlanTier: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  upgradePlanPrice: {
    display: "flex",
    alignItems: "baseline",
    marginBottom: "8px",
  },
  upgradePriceCurrency: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#6b7280",
  },
  upgradePriceAmount: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1f2937",
    margin: "0 4px",
  },
  upgradePriceCycle: {
    fontSize: "14px",
    color: "#6b7280",
  },
  upgradePlanPurpose: {
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
    lineHeight: "1.4",
  },
  upgradeFeaturesList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 20px 0",
  },
  upgradeFeatureItem: {
    fontSize: "13px",
    color: "#4b5563",
    marginBottom: "6px",
    paddingLeft: "16px",
    position: "relative",
  },
  upgradeFeatureMore: {
    fontSize: "13px",
    color: "#6b7280",
    fontStyle: "italic",
    marginBottom: "6px",
    paddingLeft: "16px",
  },
  upgradePlanButton: {
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
  },
  upgradeButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "600",
    padding: "12px 32px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease-in-out",
  },
};

export default Subscriptions;
