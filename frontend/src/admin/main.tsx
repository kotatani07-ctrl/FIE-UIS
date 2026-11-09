import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./admin.css";
import { AdminDashboard } from "./AdminDashboard";
import { AdminEnhancer } from "./AdminEnhancer";
import { initLoginPage } from "./login";

const dashboard = document.getElementById("fie-admin-dashboard");
if (dashboard) {
  const dataUrl = dashboard.dataset.dashboardUrl ?? "";
  createRoot(dashboard).render(
    <StrictMode>
      <AdminDashboard dataUrl={dataUrl} />
    </StrictMode>,
  );
}

const enhancer = document.getElementById("fie-command-root");
if (enhancer) {
  createRoot(enhancer).render(
    <StrictMode>
      <AdminEnhancer />
    </StrictMode>,
  );
}

initLoginPage();
