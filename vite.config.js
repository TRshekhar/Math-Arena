import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'module';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     host: true,
//     allowedHosts: "all"
//   }
// })


const require = createRequire(import.meta.url);

/**
 * Vite plugin: starts the Math Arena Socket.io server when `npm run dev` runs.
 * This way you only need ONE terminal — no separate `node server/server.js`.
 */
function gameServerPlugin() {
  let started = false;
  return {
    name: 'math-arena-game-server',
    configureServer() {
      if (started) return;
      started = true;
      try {
        const { startServer } = require('./server/server.js');
        startServer();
        console.log('\n🎮 Math Arena game server started on port 3001\n');
      } catch (err) {
        console.warn('\n⚠️  Game server could not start:', err.message, '\n');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), gameServerPlugin()],

  // ── CRITICAL for Electron ────────────────────────────────────────────────
  // Without base: './', Vite generates absolute paths like /assets/index.js
  // which break under the file:// protocol Electron uses in production.
  // With './', all asset paths become relative, e.g. ./assets/index.js ✅
  base: './',

  build: {
    outDir:       'dist',
    emptyOutDir:  true,
    // Increase chunk size warning limit — game assets can be large
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split vendor code for faster loads
        manualChunks: {
          react:    ['react', 'react-dom'],
        },
      },
    },
  },

  server: {
    port: 5173,
    // Allow connections from Electron's BrowserWindow
    host: 'localhost',
  },
});