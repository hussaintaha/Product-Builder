import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const Subscriptions = ({ loading, subscription, customer }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  console.log("{loading, subscription, customer}: ", {
    loading,
    subscription,
    customer,
  });

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
    } catch (error) {
      console.error(`Error ${action} subscription:`, error);
      toast.error(`Failed to ${action} subscription. Please try again.`);
    } finally {
      setIsProcessing(false);
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
            <h2 style={styles.title}>Your Active Subscription</h2>
            <div style={styles.statusContainer}>
              <span style={styles.statusBadge}>
                <span style={styles.statusDot}></span>
                {subscription.status}
              </span>
              <span style={styles.subscriptionId}>
                ID: #{subscription.subscriptionId}
              </span>
            </div>
          </div>

          {/* Customer Information & Items */}
          <div style={styles.gridContainer}>
            {/* Customer Info */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Customer Details</h3>
              <div style={styles.infoContent}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Name: </span>
                  <span style={styles.value}>
                    {subscription.firstName} {subscription.lastName}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Customer ID: </span>
                  <span style={styles.customerIdValue}>
                    {subscription.customerId}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Items */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Subscription Items</h3>
              {subscription.items &&
                subscription.items.map((item) => (
                  <div key={item.id} style={styles.infoContent}>
                    <div style={styles.infoRow}>
                      <span style={styles.label}>Plan: </span>
                      <span style={styles.value}>{item.title}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.label}>Price: </span>
                      <span style={styles.priceValue}>
                        ${parseFloat(item.final_price).toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.label}>Quantity: </span>
                      <span style={styles.value}>{item.quantity}</span>
                    </div>
                    {item.properties &&
                      item.properties.map((prop, index) => (
                        <div key={index} style={styles.infoRow}>
                          <span style={styles.label}>{prop.key}: </span>
                          <span style={styles.value}>{prop.value}</span>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          </div>

          {/* Billing Summary */}
          <div style={styles.pricingSummary}>
            <h3 style={styles.cardTitle}>Billing Summary</h3>
            <div style={styles.pricingGrid}>
              {subscription.items &&
                subscription.items.map((item) => (
                  <React.Fragment key={item.id}>
                    <div style={styles.pricingItem}>
                      <div style={styles.pricingLabel}>Original Price</div>
                      <div style={styles.originalPrice}>
                        ${parseFloat(item.original_price).toFixed(2)}
                      </div>
                    </div>
                    <div style={styles.pricingItem}>
                      <div style={styles.pricingLabel}>Discount</div>
                      <div style={styles.discountPrice}>
                        -${parseFloat(item.total_discount).toFixed(2)}
                      </div>
                    </div>
                    <div style={styles.pricingItem}>
                      <div style={styles.pricingLabel}>Final Amount</div>
                      <div style={styles.finalPrice}>
                        ${parseFloat(item.final_price).toFixed(2)}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={styles.buttonContainer}>
            {subscription.status === "PAUSED" ? (
              <>
                {/* Reactivate Button */}
                <button
                  onClick={() =>
                    handleSubscriptionManage(
                      subscription.subscriptionId,
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
                      subscription.subscriptionId,
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
            ) : (
              <>
                {/* Pause Button */}
                <button
                  onClick={() =>
                    handleSubscriptionManage(
                      subscription.subscriptionId,
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
                      subscription.subscriptionId,
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
            )}
          </div>

          {/* Help Text */}
          <div style={styles.helpText}>
            <div style={styles.helpContent}>
              <strong>Note:</strong>{" "}
              {subscription.status === "ACTIVE" &&
                "Pausing your subscription will temporarily stop billing and deliveries. You can resume anytime. Canceling will permanently end your subscription."}
              {subscription.status === "PAUSED" &&
                "Your subscription is currently paused. Reactivate to resume billing and deliveries, or cancel to permanently end your subscription."}
              {subscription.status === "CANCELLED" &&
                "Your subscription has been cancelled. You can reactivate it to resume your subscription benefits."}
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.noSubscription}>
          <div style={styles.noSubscriptionTitle}>
            No active subscription found
          </div>
          <p style={styles.noSubscriptionText}>
            You don't have any active subscriptions at the moment.
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
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#22c55e",
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
  singleButtonContainer: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "16px",
  },
};

export default Subscriptions;
