import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_ORIGIN, VITE_API_BASE_URL } = loadEnv(mode, process.cwd(), "");
  // Dev proxy target is the bare origin — `/api` and `/hubs` paths already carry
  // their own prefix, so strip any `/api/v1` off VITE_API_BASE_URL (handoff §1).
  // Falls back to the real LexKotib backend so `npm run dev` works even without a `.env`.
  const proxyTarget =
    VITE_API_ORIGIN ||
    (VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "") ||
    "https://api.beezy.uz";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // Backend has no CORS yet — proxy same-origin `/api`, `/hubs`, `/health`
        // calls to the real host in dev; prod talks to the absolute origin
        // directly (handoff §1/§2 — backend allowlists the app origin).
        "/api": { target: proxyTarget, changeOrigin: true, secure: false },
        "/hubs": { target: proxyTarget, changeOrigin: true, ws: true, secure: false },
        "/health": { target: proxyTarget, changeOrigin: true, secure: false },
      },
    },
  };
});
