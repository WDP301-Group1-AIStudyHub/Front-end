import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:4000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define:
      mode === "development"
        ? {
            "import.meta.env.VITE_API_BASE_URL": JSON.stringify(""),
          }
        : {},
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return undefined;
            }

            if (id.includes("@assistant-ui") || id.includes("remark-gfm")) {
              return "vendor-ai-chat";
            }

            if (id.includes("radix-ui")) {
              return "vendor-radix";
            }

            if (id.includes("motion")) {
              return "vendor-motion";
            }

            if (
              id.includes("react") ||
              id.includes("scheduler") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }

            return "vendor";
          },
        },
      },
    },
  };
});
