import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/app.tsx";
import "./shared/styles/tag-styles.css";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./app/providers.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AppProviders>
      <App />
    </AppProviders>
  </BrowserRouter>
);
