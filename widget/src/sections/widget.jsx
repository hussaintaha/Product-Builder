import React, { useState } from "react";

const PreloaderStyles = `
  .preloader-fullscreen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    z-index: 99;
  }

  .preloader-card {
    background: rgba(248, 250, 252, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(226, 232, 240, 0.3);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    text-align: center;
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(226, 232, 240, 0.2);
    position: relative;
    overflow: hidden;
    max-width: 400px;
    width: 90%;
    animation: card-entrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transform: translateY(20px);
    opacity: 0;
  }

  @keyframes card-entrance {
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .preloader-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.8), transparent);
    animation: shimmer-top 3s ease-in-out infinite;
  }

  @keyframes shimmer-top {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
  }

  .loading-spinner {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto 2rem;
  }

  .spinner-orbit {
    position: absolute;
    border: 2px solid transparent;
    border-radius: 50%;
  }

  .spinner-orbit:nth-child(1) {
    width: 80px;
    height: 80px;
    border-top: 2px solid #6366f1;
    border-right: 2px solid rgba(99, 102, 241, 0.3);
    animation: spin-fast 1.2s linear infinite;
  }

  .spinner-orbit:nth-child(2) {
    width: 60px;
    height: 60px;
    top: 10px;
    left: 10px;
    border-left: 2px solid #8b5cf6;
    border-bottom: 2px solid rgba(139, 92, 246, 0.3);
    animation: spin-medium 1.8s linear infinite reverse;
  }

  .spinner-orbit:nth-child(3) {
    width: 40px;
    height: 40px;
    top: 20px;
    left: 20px;
    border-right: 2px solid #06b6d4;
    border-top: 2px solid rgba(6, 182, 212, 0.3);
    animation: spin-slow 2.4s linear infinite;
  }

  .spinner-center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12px;
    height: 12px;
    background: linear-gradient(45deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: pulse-center 2s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
  }

  @keyframes spin-fast {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes spin-medium {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse-center {
    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; }
  }

  .loading-content {
    color: #1e293b;
  }

  .loading-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.02em;
  }

  .loading-subtitle {
    font-size: 14px;
    color: rgba(71, 85, 105, 0.7);
    margin-bottom: 1.5rem;
  }

  .loading-progress {
    width: 180px;
    height: 4px;
    background: rgba(226, 232, 240, 0.4);
    border-radius: 2px;
    margin: 0 auto;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1);
    background-size: 300% 100%;
    border-radius: 2px;
    animation: progress-wave 2.5s ease-in-out infinite;
    width: 75%;
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
  }

  @keyframes progress-wave {
    0% { background-position: 0% 50%; width: 20%; }
    50% { background-position: 100% 50%; width: 80%; }
    100% { background-position: 200% 50%; width: 95%; }
  }
`;

const WidgetPreloader = () => (
  <>
    <style>{PreloaderStyles}</style>
    <div className="preloader-fullscreen">
      <div className="preloader-card">
        <div className="brand-logo" style={{ marginBottom: "1.5rem" }}>
          <img
            src="https://cdn.shopify.com/s/files/1/0965/9544/4026/files/pd-builder-logo.png?v=1758542981"
            alt="logo"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        <div className="loading-spinner">
          <div className="spinner-orbit"></div>
          <div className="spinner-orbit"></div>
          <div className="spinner-orbit"></div>
          <div className="spinner-center"></div>
        </div>

        <div className="loading-content">
          <div className="loading-title">Loading Widget...</div>
          <div className="loading-subtitle">Preparing your experience</div>
          <div className="loading-progress">
            <div className="progress-bar"></div>
          </div>
        </div>
      </div>
    </div>
  </>
);

const Widget = ({ customer_id }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div style={{ height: "99vh", position: "relative", overflow: "hidden" }}>
      {isLoading && <WidgetPreloader />}
      <iframe
        name="myiFrame"
        width="100%"
        height="100%"
        src={`https://e04e1f45-ddfa-4cfd-aa2c-825ae20bc005-00-4q1rcyndehbs.kirk.replit.dev/?customer_id=${customer_id}`}
        scrolling="no"
        marginWidth="0"
        marginHeight="0"
        style={{
          border: "0px none #ffffff",
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.4s ease-in-out",
        }}
        onLoad={handleIframeLoad}
      />
    </div>
  );
};

export default Widget;
