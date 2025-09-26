import React, { useState } from "react";
import { User } from "lucide-react";

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

const PricingPlan = () => {
  const [localLoading, setLocalLoading] = useState(false);

  const fetchSellingPlan = async (product_id) => {
    try {
      const response = await fetch(
        `/apps/public/api/v1/public/selling-plan/?product_id=${product_id}`,
        {
          method: "GET",
        },
      );

      const responseData = await response.json();
      const { success, error, data } = responseData;

      if (!success && !data && error) {
        console.log(error);
        return null;
      } else if (success && data && !error) {
        return data;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const handleAddToCart = async (plan) => {
    setLocalLoading(true);
    console.log("Selected plan: ", plan);
    
    const sellingPlanData = await fetchSellingPlan(plan.product_id);
    
    if (!sellingPlanData) {
      console.error("Failed to fetch selling plan data");
      setLocalLoading(false);
      return;
    }

    const { product, sellingPlans } = sellingPlanData;
    console.log("sellingPlans: ", sellingPlans);

    const filteredSellingPlan = sellingPlans.filter(
      (e) => String(e?.groupId) === String(plan.group_id),
    )[0];

    console.log(filteredSellingPlan, "filteredSellingPlan");

    if (product && filteredSellingPlan) {
      const url = `/products/${product?.handle}?selling_plan=${filteredSellingPlan?.id}&variant=${plan.variant_id}`;
      console.log("Redirecting to: ", url);
      window.location.href = url;
    } else {
      console.error("Missing product or selling plan data");
      setLocalLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .pricing-container {
          max-width: 120rem;
          margin: 0 auto;
          padding: 4rem 2.4rem 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .account-button {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 1000;
          background: white;
          border: 0.1rem solid #e2e8f0;
          border-radius: 0.8rem;
          padding: 1rem;
          box-shadow: 0 0.4rem 1.2rem rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .account-button:hover {
          background: #f7fafc;
          box-shadow: 0 0.6rem 2rem rgba(0, 0, 0, 0.15);
          transform: translateY(-0.1rem);
        }

        .account-button svg {
          color: #4a5568;
          transition: color 0.3s ease;
        }

        .account-button:hover svg {
          color: #2d3748;
        }

        .info-banner {
          background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%);
          border: 0.1rem solid #9ae6b4;
          border-radius: 0.8rem;
          padding: 1.2rem 2rem;
          margin: 0 0 2rem 0;
          text-align: center;
          font-size: 1.4rem;
          color: #276749;
          position: relative;
          overflow: hidden;
        }

        .info-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .info-banner-icon {
          display: inline-block;
          margin-right: 0.8rem;
          font-size: 1.6rem;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 3rem;
          flex-shrink: 0;
        }

        .logo {
          width: 20rem;
          height: auto;
          margin-bottom: 2rem;
        }

        .pricing-title {
          font-size: 3.2rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 1rem 0;
          letter-spacing: -0.025em;
          line-height: 1.1;
        }

        .pricing-subtitle {
          font-size: 1.4rem;
          color: #718096;
          margin: 0;
          font-weight: 400;
          max-width: 70rem;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.4;
        }

        .subscription-status {
          text-align: center;
          margin: 1rem 0;
          padding: 1rem;
          border-radius: 0.8rem;
          font-size: 1.4rem;
          font-weight: 500;
        }

        .status-loading {
          background: #ebf8ff;
          color: #2b6cb0;
          border: 1px solid #bee3f8;
        }

        .status-success {
          background: #f0fff4;
          color: #276749;
          border: 1px solid #9ae6b4;
        }

        .status-warning {
          background: #fffaf0;
          color: #c05621;
          border: 1px solid #fbd38d;
        }

        .status-error {
          background: #fed7d7;
          color: #c53030;
          border: 1px solid #feb2b2;
        }

        .status-info {
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .pricing-grid {
          display: grid;
          gap: 2rem;
          align-items: stretch;
          flex: 1;
        }

        /* Responsive grid: >992px = 3 columns, 600-992px = 2 columns, <600px = 1 column */
        @media (min-width: 99.2rem) {
          .pricing-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 60rem) and (max-width: 99.1rem) {
          .pricing-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 59.9rem) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }

        .pricing-card {
          background: white;
          border-radius: 1.6rem;
          padding: 2.4rem 2rem;
          position: relative;
          box-shadow: 0 0.4rem 2rem rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 0.1rem solid #e2e8f0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 0.4rem;
          background: linear-gradient(90deg, #667eea, #764ba2);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-0.8rem);
          box-shadow: 0 1.6rem 3.2rem rgba(0, 0, 0, 0.12);
          border-color: #cbd5e0;
        }

        .pricing-card:hover::before {
          opacity: 1;
        }

        .pricing-card.popular {
          transform: scale(1.02);
          border: 0.2rem solid #667eea;
          box-shadow: 0 1.6rem 3.2rem rgba(102, 126, 234, 0.15);
        }

        .pricing-card.popular::before {
          opacity: 1;
          height: 0.6rem;
        }

        .popular-badge {
          position: absolute;
          top: -0.1rem;
          right: 2rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 0.6rem 1.6rem;
          border-radius: 0 0 0.8rem 0.8rem;
          font-size: 1.4rem;
          font-weight: 600;
          letter-spacing: 0.025em;
          text-transform: uppercase;
        }

        .plan-header {
          margin-bottom: 2rem;
          flex-shrink: 0;
        }

        .plan-tier {
          font-size: 2.4rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 0.8rem 0;
          letter-spacing: -0.025em;
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          margin-bottom: 1rem;
        }

        .price-amount {
          font-size: 3.6rem;
          font-weight: 800;
          color: #2d3748;
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .price-currency {
          font-size: 1.4rem;
          font-weight: 600;
          color: #718096;
          margin-right: 0.4rem;
        }

        .price-cycle {
          font-size: 1.4rem;
          color: #718096;
          margin-left: 0.4rem;
          font-weight: 500;
        }

        .plan-purpose {
          font-size: 1.4rem;
          color: #4a5568;
          margin: 0;
          font-weight: 400;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 1.6rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 1.2rem;
          font-size: 1.4rem;
          color: #4a5568;
        }

        .feature-item::before {
          content: '✓';
          color: #48bb78;
          font-weight: 700;
          font-size: 1.2rem;
          margin-right: 1rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .cta-button {
          width: 100%;
          padding: 1.2rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 0.8rem;
          font-size: 1.6rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.025em;
          position: relative;
          overflow: hidden;
          margin-top: auto;
          flex-shrink: 0;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .cta-button:hover {
          transform: translateY(-0.2rem);
          box-shadow: 0 1.2rem 2.4rem rgba(102, 126, 234, 0.4);
        }

        .cta-button:hover::before {
          left: 100%;
        }

        .cta-button:active {
          transform: translateY(0);
        }

        .cta-button:disabled {
          background: #a0aec0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .cta-button:disabled:hover::before {
          left: -100%;
        }

        /* Mobile responsive adjustments */
        @media (max-width: 76.8rem) {
          .pricing-container {
            padding: 3rem 1.6rem 2rem;
          }

          .account-button {
            top: 1.5rem;
            right: 1.5rem;
            padding: 0.8rem;
          }

          .info-banner {
            padding: 1rem 1.5rem;
            font-size: 1.3rem;
          }

          .pricing-title {
            font-size: 2.8rem;
          }

          .pricing-subtitle {
            font-size: 1.3rem;
          }

          .logo {
            width: 20rem;
            margin-bottom: 1.5rem;
          }

          .pricing-header {
            margin-bottom: 2rem;
          }

          .pricing-grid {
            gap: 1.6rem;
          }

          .pricing-card {
            padding: 2rem 1.6rem;
          }

          .pricing-card.popular {
            transform: none;
          }

          .price-amount {
            font-size: 2.8rem;
          }

          .plan-tier {
            font-size: 1.6rem;
          }

          .plan-purpose {
            font-size: 1.1rem;
          }

          .feature-item {
            font-size: 1rem;
            margin-bottom: 1rem;
          }

          .cta-button {
            font-size: 1.2rem;
            padding: 1rem 1.6rem;
          }

          .subscription-status {
            font-size: 1.2rem;
            padding: 0.8rem;
          }
        }

        @media (max-width: 48rem) {
          .pricing-container {
            padding: 2rem 1.6rem;
          }

          .account-button {
            top: 1rem;
            right: 1rem;
            padding: 0.6rem;
          }

          .info-banner {
            padding: 0.8rem 1.2rem;
            font-size: 1.2rem;
            margin-bottom: 1.5rem;
          }

          .pricing-title {
            font-size: 2.4rem;
          }

          .pricing-subtitle {
            font-size: 1.2rem;
          }

          .logo {
            width: 20rem;
            margin-bottom: 1rem;
          }

          .pricing-header {
            margin-bottom: 1.5rem;
          }

          .pricing-card {
            padding: 1.6rem 1.2rem;
          }

          .popular-badge {
            right: 1.2rem;
            padding: 0.5rem 1.2rem;
            font-size: 0.9rem;
          }

          .plan-tier {
            font-size: 2.4rem;
          }

          .price-amount {
            font-size: 2.4rem;
          }

          .price-currency {
            font-size: 1.4rem;
          }

          .price-cycle {
            font-size: 1.4rem;
          }

          .plan-purpose {
            font-size: 1.4rem;
          }

          .feature-item {
            font-size: 1.4rem;
            margin-bottom: 0.8rem;
          }

          .feature-item::before {
            font-size: 1.6rem;
            margin-right: 0.8rem;
          }

          .cta-button {
            font-size: 1.6rem;
            padding: 1rem 1.4rem;
          }

          .features-list {
            margin: 1.2rem 0;
          }

          .subscription-status {
            font-size: 1.1rem;
            padding: 0.6rem;
          }
        }

        @media (max-width: 59.9rem) and (orientation: landscape) {
          .pricing-container {
            height: auto;
            min-height: 100vh;
          }
        }
      `}</style>

      {/* Account Button */}
      <a href="/account" className="account-button">
        <User size={20} />
      </a>

      <div className="pricing-container">
        <div className="pricing-header">
          <img
            src="https://cdn.shopify.com/s/files/1/0965/9544/4026/files/pd-builder-logo.png?v=1758542981"
            alt="PD Builder Logo"
            className="logo"
          />
          <h1 className="pricing-title">Choose Your Plan</h1>
          <p className="pricing-subtitle">
            Transform your ideas into market-ready products with our
            comprehensive suite of tools
          </p>
        </div>

        {/* Info Banner */}
        <div className="info-banner">
          <span className="info-banner-icon">ℹ️</span>
          To upgrade your plan, you'll need to cancel your existing subscription first.
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <div
              key={plan.tier}
              className={`pricing-card ${plan.popular ? "popular" : ""}`}
            >
              {plan.popular && (
                <div className="popular-badge">Most Popular</div>
              )}

              <div className="plan-header">
                <h3 className="plan-tier">{plan.tier}</h3>
                <div className="plan-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-cycle">/{plan.billingCycle}</span>
                </div>
                <p className="plan-purpose">{plan.purpose}</p>
              </div>

              <ul className="features-list">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="feature-item">
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className="cta-button"
                onClick={() => handleAddToCart(plan)}
                disabled={localLoading}
              >
                {localLoading ? "Loading..." : "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PricingPlan;