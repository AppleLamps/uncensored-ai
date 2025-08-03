import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        settings: resolve(__dirname, 'settings.html')
        // Removed test: resolve(__dirname, 'test-code-formatting.html')
      },
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash].[ext]`;
          }

          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash].[ext]`;
          }

          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash].[ext]`;
          }

          return `assets/[name]-[hash].[ext]`;
        }
      }
    },
    target: 'es2015',
    assetsDir: 'assets',
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true,
    hmr: true,
    cors: true,
    host: 'localhost'
  },
  preview: {
    port: 4173,
    open: true,
    cors: true,
    host: 'localhost'
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./assets/css/variables.scss";`
      }
    },
    postcss: {
      plugins: [
        {
          postcssPlugin: 'custom-css-vars',
          Once(root) {
            // Custom CSS variable handling if needed
          }
        }
      ]
    }
  },
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf', '**/*.otf'],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'assets'),
      '@js': resolve(__dirname, 'assets/js'),
      '@css': resolve(__dirname, 'assets/css'),
      '@images': resolve(__dirname, 'assets/images'),
      '@fonts': resolve(__dirname, 'assets/fonts')
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    include: ['marked'],
    force: false,
    esbuildOptions: {
      target: 'es2015'
    }
  },
  envPrefix: 'VITE_',
  logLevel: 'info',
  clearScreen: true
});
