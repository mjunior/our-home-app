import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { installViteApi } from "./src/server/vite-api";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "foundation-api-middleware",
      configureServer(server) {
        installViteApi(server);
      },
      configurePreviewServer(server) {
        installViteApi(server);
      },
    },
  ],
});
