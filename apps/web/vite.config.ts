import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@evidenra/core': path.resolve(__dirname, '../../packages/core/src'),
        '@evidenra/ui': path.resolve(__dirname, '../../packages/ui/src'),
        '@evidenra/supabase': path.resolve(__dirname, '../../packages/supabase/src'),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
    build: {
      outDir: 'dist',
      // Phase 1: Kopierschutz - Source Maps DEAKTIVIERT in Production
      sourcemap: mode === 'development',
      // Phase 1: Terser statt esbuild für bessere Obfuscation
      minify: mode === 'production' ? 'terser' : 'esbuild',
      terserOptions: mode === 'production' ? {
        compress: {
          // Console.log Statements entfernen
          drop_console: true,
          drop_debugger: true,
          // Toten Code entfernen
          dead_code: true,
          // Unbenutzte Variablen entfernen
          unused: true,
          // Passes für bessere Kompression
          passes: 2,
        },
        mangle: {
          // Variablennamen verschleiern
          toplevel: true,
          // Safari-kompatibel bleiben
          safari10: true,
        },
        format: {
          // Kommentare entfernen
          comments: false,
          // Code kompakt halten
          beautify: false,
        },
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['zustand', '@supabase/supabase-js'],
            pdf: ['pdfjs-dist'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  }
})
