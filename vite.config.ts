import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_ORIGIN, VITE_API_BASE_URL } = loadEnv(mode, process.cwd(), "");
  // Dev proxy target is the bare origin — `/api` and `/hubs` paths already carry
  // their own prefix, so strip any `/api/v1` off VITE_API_BASE_URL (handoff §1).
  const proxyTarget =
    VITE_API_ORIGIN ||
    (VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "") ||
    "https://example.com";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        // Backend has no CORS yet — proxy same-origin `/api` + `/hubs` calls
        // to the real host in dev; prod sits behind a same-origin reverse proxy.
        "/api": { target: proxyTarget, changeOrigin: true, secure: false },
        "/hubs": { target: proxyTarget, changeOrigin: true, ws: true, secure: false },
        "/health": { target: proxyTarget, changeOrigin: true, secure: false },
      },
    },
  };
});
