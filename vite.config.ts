import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "foundation-api-middleware",
      async configureServer(server) {
        const { installViteApi } = await import("./src/server/vite-api");
        installViteApi(server);
      },
      async configurePreviewServer(server) {
        const { installViteApi } = await import("./src/server/vite-api");
        installViteApi(server);
      },
    },
  ],
});
