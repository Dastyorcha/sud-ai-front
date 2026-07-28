import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_API_BASE_URL } = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = VITE_API_BASE_URL || "https://example.com";

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
        "/api": { target: apiBaseUrl, changeOrigin: true, secure: false },
        "/hubs": { target: apiBaseUrl, changeOrigin: true, ws: true, secure: false },
      },
    },
  };
});
