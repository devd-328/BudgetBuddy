import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Prompt for updates instead of auto-updating
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'BudgetBuddy',
        short_name: 'BudgetBuddy',
        description: 'Smart personal finance tracker for Pakistani students',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        categories: ['finance', 'efficiency'],
        shortcuts: [
          {
            name: 'Add Transaction',
            short_name: 'Add',
            description: 'Record a new expense or income',
            url: '/add',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'AI Insights',
            short_name: 'AI',
            description: 'Get tailored financial advice',
            url: '/ai',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          }
        ],
        icons: [
          {
            src: 'google_consent_logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'google_consent_logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'google_consent_logo.png',
            sizes: '1024x1024',
            type: 'image/png',
          },
          {
            src: 'google_consent_logo.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/desktop-dashboard.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Modern Dashboard'
          },
          {
            src: 'screenshots/mobile-dashboard.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobile View'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          }
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // We'll rely on lazy() imports in App.jsx for now
      },
    },
  },
})
