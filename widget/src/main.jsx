import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import "./globals.css";
import App from "./App.jsx";

createRoot(document.getElementById("PRODUCT_BUILDER")).render(
  <StrictMode>
    <ToastContainer />
    <App />
  </StrictMode>,
);
