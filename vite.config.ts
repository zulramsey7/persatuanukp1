/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",

  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),

    mode === "development" && componentTagger(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
      ],

      manifest: {
        id: "/",
        name: "Persatuan Penduduk Taman Ukay Perdana UP1",
        short_name: "Persatuan Ukay Perdana",
        description:
          "Aplikasi rasmi Persatuan Penduduk Taman Ukay Perdana UP1 - Portal Komuniti Digital",

        theme_color: "#0f172a",
        background_color: "#ffffff",

        display: "standalone",
        orientation: "any",

        scope: "/",
        start_url: "/",

        lang: "ms",
        dir: "ltr",

        categories: [
          "community",
          "productivity",
          "utilities",
          "social",
        ],

        launch_handler: {
          client_mode: "navigate-existing",
        },

        prefer_related_applications: false,

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],

        shortcuts: [
          {
            name: "Aduan",
            short_name: "Aduan",
            description: "Buat aduan atau cadangan",
            url: "/aduan",
            icons: [
              {
                src: "/pwa-192x192.png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Direktori",
            short_name: "Direktori",
            description: "Direktori ahli komuniti",
            url: "/direktori",
            icons: [
              {
                src: "/pwa-192x192.png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Kewangan",
            short_name: "Kewangan",
            description: "Semak status pembayaran",
            url: "/kewangan",
            icons: [
              {
                src: "/pwa-192x192.png",
                sizes: "192x192",
              },
            ],
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,woff2}",
        ],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
}));
