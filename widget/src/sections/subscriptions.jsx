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
  const [loadingStates, setLoadingStates] = useState({
    pause: false,
    cancel: false,
    resume: false
  });
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
    // Set loading state only for this specific action
    setLoadingStates(prev => ({
      ...prev,
      [action]: true
    }));
    
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
      setLoadingStates(prev => ({
        ...prev,
        [action]: false
      }));
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
              <div style={styles.upgradeButtonContainer}>
                <a
                  href="/pages/pricing"
                  style={styles.upgradeButton}
                  className="upgrade-plan-btn"
                >
                  View All Plans & Upgrade
                </a>
              </div>
            </div>
          )}

          {/* Subscription Actions */}
          {hasValidSubscriptionId && (
            <div style={styles.actionsCard}>
              <h3 style={styles.cardTitle}>Subscription Actions</h3>
              <div style={styles.actionsContent}>
                <div style={styles.actionsGrid}>
                  {subscription.subscription_status === "active" && (
                    <>
                      <button
                        onClick={() =>
                          handleSubscriptionManage(
                            subscription.subscription_id,
                            "pause",
                          )
                        }
                        disabled={loadingStates.pause}
                        style={{
                          ...styles.actionButton,
                          ...styles.pauseButton,
                        }}
                        className="pause-btn"
                      >
                        {loadingStates.pause ? "Pausing..." : "Pause Subscription"}
                      </button>
                      <button
                        onClick={() =>
                          handleSubscriptionManage(
                            subscription.subscription_id,
                            "cancel",
                          )
                        }
                        disabled={loadingStates.cancel}
                        style={{
                          ...styles.actionButton,
                          ...styles.cancelButton,
                        }}
                        className="cancel-btn"
                      >
                        {loadingStates.cancel ? "Cancelling..." : "Cancel Subscription"}
                      </button>
                    </>
                  )}
                  {subscription.subscription_status === "paused" && (
                    <button
                      onClick={() =>
                        handleSubscriptionManage(
                          subscription.subscription_id,
                          "activate",
                        )
                      }
                      disabled={loadingStates.resume}
                      style={{
                        ...styles.actionButton,
                        ...styles.activateButton,
                      }}
                      className="activate-btn"
                    >
                      {loadingStates.resume ? "Activating..." : "Activate Subscription"}
                    </button>
                  )}
                </div>
                <p style={styles.actionsNote}>
                  Note: You can pause your subscription for up to 3 months. Your
                  subscription will automatically resume after the pause period.
                </p>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div style={styles.additionalInfo}>
            <h3 style={styles.cardTitle}>Additional Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.label}>Created: </span>
                <span style={styles.value}>
                  {new Date(
                    subscription.created_at,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.label}>Next Billing Date: </span>
                <span style={styles.value}>
                  {subscription.next_billing_date
                    ? new Date(
                        subscription.next_billing_date,
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              {subscription.pause_date && (
                <div style={styles.infoItem}>
                  <span style={styles.label}>Pause Date: </span>
                  <span style={styles.value}>
                    {new Date(
                      subscription.pause_date,
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.resume_date && (
                <div style={styles.infoItem}>
                  <span style={styles.label}>Resume Date: </span>
                  <span style={styles.value}>
                    {new Date(
                      subscription.resume_date,
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.noSubscription}>
          <div style={styles.noSubscriptionContent}>
            <h2 style={styles.noSubscriptionTitle}>
              No Active Subscription
            </h2>
            <p style={styles.noSubscriptionText}>
              You don't have an active subscription. Choose a plan to get
              started with our premium features.
            </p>
            <a href="/pages/pricing" style={styles.ctaButton}>
              View Pricing Plans
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "4rem",
  },
  loadingText: {
    fontSize: "1.2rem",
    color: "#666",
  },
  subscriptionCard: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    padding: "2rem",
    border: "1px solid #e5e7eb",
  },
  backButtonContainer: {
    marginBottom: "1.5rem",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#475569",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  backArrow: {
    fontSize: "1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "1.875rem",
    fontWeight: "700",
    color: "#1f2937",
    margin: "0",
  },
  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.875rem",
    fontWeight: "600",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  subscriptionId: {
    fontSize: "0.875rem",
    color: "#6b7280",
    fontFamily: "monospace",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "1.5rem",
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 1rem 0",
  },
  infoContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: "0.875rem",
    color: "#6b7280",
    fontWeight: "500",
  },
  value: {
    fontSize: "0.875rem",
    color: "#1f2937",
    fontWeight: "600",
  },
  customerIdValue: {
    fontSize: "0.75rem",
    color: "#6b7280",
    fontFamily: "monospace",
    fontWeight: "400",
  },
  priceValue: {
    fontSize: "1rem",
    color: "#059669",
    fontWeight: "700",
  },
  pricingSummary: {
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    padding: "1.5rem",
    border: "1px solid #bae6fd",
    marginBottom: "2rem",
  },
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  pricingItem: {
    textAlign: "center",
    padding: "1rem",
  },
  pricingLabel: {
    fontSize: "0.875rem",
    color: "#0369a1",
    marginBottom: "0.5rem",
    fontWeight: "500",
  },
  originalPrice: {
    fontSize: "1.5rem",
    color: "#1e40af",
    fontWeight: "700",
  },
  discountPrice: {
    fontSize: "1.5rem",
    color: "#dc2626",
    fontWeight: "700",
  },
  finalPrice: {
    fontSize: "1.5rem",
    color: "#059669",
    fontWeight: "700",
  },
  upgradeSection: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "2rem",
    border: "1px solid #e2e8f0",
    marginBottom: "2rem",
  },
  upgradeSectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 0.5rem 0",
    textAlign: "center",
  },
  upgradeSectionSubtitle: {
    fontSize: "1rem",
    color: "#6b7280",
    textAlign: "center",
    margin: "0 0 2rem 0",
  },
  upgradeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  upgradePlanCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    border: "2px solid #e2e8f0",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  upgradePlanHeader: {
    marginBottom: "1rem",
  },
  upgradePlanTier: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 0.5rem 0",
  },
  upgradePlanPrice: {
    display: "flex",
    alignItems: "baseline",
    marginBottom: "0.5rem",
  },
  upgradePriceCurrency: {
    fontSize: "1rem",
    color: "#6b7280",
    fontWeight: "600",
    marginRight: "0.25rem",
  },
  upgradePriceAmount: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#1f2937",
  },
  upgradePriceCycle: {
    fontSize: "0.875rem",
    color: "#6b7280",
    marginLeft: "0.25rem",
  },
  upgradePlanPurpose: {
    fontSize: "0.875rem",
    color: "#6b7280",
    margin: "0",
    lineHeight: "1.4",
  },
  upgradeFeaturesList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
  },
  upgradeFeatureItem: {
    fontSize: "0.875rem",
    color: "#374151",
    padding: "0.25rem 0",
    position: "relative",
    paddingLeft: "1rem",
  },
  upgradeFeatureItemBefore: {
    content: "'✓'",
    position: "absolute",
    left: "0",
    color: "#10b981",
    fontWeight: "bold",
  },
  upgradeFeatureMore: {
    fontSize: "0.75rem",
    color: "#6b7280",
    fontStyle: "italic",
    padding: "0.25rem 0",
  },
  upgradeButtonContainer: {
    textAlign: "center",
  },
  upgradeButton: {
    display: "inline-block",
    padding: "0.75rem 2rem",
    backgroundColor: "#3b82f6",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
  },
  actionsCard: {
    backgroundColor: "#fef7ed",
    borderRadius: "8px",
    padding: "1.5rem",
    border: "1px solid #fdba74",
    marginBottom: "2rem",
  },
  actionsContent: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  actionsGrid: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  actionButton: {
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    flex: "1",
    minWidth: "160px",
  },
  pauseButton: {
    backgroundColor: "#f59e0b",
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#dc2626",
    color: "#fff",
  },
  activateButton: {
    backgroundColor: "#059669",
    color: "#fff",
  },
  actionsNote: {
    fontSize: "0.75rem",
    color: "#92400e",
    margin: "0",
    lineHeight: "1.4",
  },
  additionalInfo: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "1.5rem",
    border: "1px solid #e2e8f0",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
  },
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noSubscription: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
  },
  noSubscriptionContent: {
    textAlign: "center",
    maxWidth: "400px",
  },
  noSubscriptionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 1rem 0",
  },
  noSubscriptionText: {
    fontSize: "1rem",
    color: "#6b7280",
    margin: "0 0 2rem 0",
    lineHeight: "1.5",
  },
  ctaButton: {
    display: "inline-block",
    padding: "0.75rem 2rem",
    backgroundColor: "#3b82f6",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "600",
    transition: "background-color 0.2s ease",
  },
};

export default Subscriptions;