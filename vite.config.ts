import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

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
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "images/launchericon-48x48.png",
        "images/launchericon-72x72.png",
        "images/launchericon-96x96.png",
        "images/launchericon-144x144.png",
        "images/launchericon-192x192.png",
        "images/launchericon-512x512.png",
      ],
      manifest: {
        id: "/",
        name: "Our Home App",
        short_name: "OurHome",
        description: "Gestao financeira da casa com foco em rotina, previsao e controle.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0f172a",
        theme_color: "#0f172a",
        categories: ["finance", "productivity"],
        icons: [
          {
            src: "/images/launchericon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/images/launchericon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/images/launchericon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/images/launchericon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-assets",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-assets",
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
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
