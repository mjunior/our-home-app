import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    allowedHosts: ["home.jsjunior.cloud", "instrutor-autonomo-ourhomeapp.0niizy.easypanel.host"],
  },
  preview: {
    allowedHosts: ["home.jsjunior.cloud", "instrutor-autonomo-ourhomeapp.0niizy.easypanel.host"],
  },
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
