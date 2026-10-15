import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

// En desarrollo el backend corre en :8000. El proxy deja la API en el mismo
// origen que el front: sin CORS y con la cookie de refresco (path /api/v1/auth)
// funcionando (F-103 del arnés en moravia-backend/frontend).
const API_TARGET = "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": API_TARGET,
      "/health": API_TARGET,
    },
  },
  build: {
    outDir: "dist",
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
});
