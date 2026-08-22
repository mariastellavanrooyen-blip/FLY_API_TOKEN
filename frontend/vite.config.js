import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative base so the built app works whether it's served from a domain
  // root or a subpath (e.g. GitHub Pages project sites at /<repo-name>/).
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: "The Wife's Brain — Household Planner",
        short_name: "Wife's Brain",
        description:
          'A household planner: family calendar, a two-income budget tracker with monthly reports, a recipe box, and a shopping list with trip-day reminders.',
        theme_color: '#6f8b67',
        background_color: '#fbf3e7',
        display: 'standalone',
        start_url: './',
        scope: './',
        orientation: 'portrait-primary',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
