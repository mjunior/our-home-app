import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    host: true,
    port: Number(process.env.PORT ?? 5174),
    strictPort: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "home.jsjunior.cloud",
      "trevo.jsjunior.cloud",
      "instrutor-autonomo-ourhomeapp.0niizy.easypanel.host",
    ],
  },
  preview: {
    host: true,
    port: Number(process.env.PORT ?? 5174),
    strictPort: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "home.jsjunior.cloud",
      "trevo.jsjunior.cloud",
      "instrutor-autonomo-ourhomeapp.0niizy.easypanel.host",
    ],
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
