import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store"; // ✅ your Redux store
import "./index.css";
import App from "./App.jsx";

import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";

// Initialize MSAL instance
const pca = new PublicClientApplication(msalConfig);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MsalProvider instance={pca}>
      <Provider store={store}>
        <App />
      </Provider>
    </MsalProvider>
  </StrictMode>
);
