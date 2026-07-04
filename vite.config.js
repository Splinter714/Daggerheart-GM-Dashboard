import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { execSync } from 'child_process'
import fs from 'fs'

// Get package.json version
function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, './package.json'), 'utf8'))
    return packageJson.version
  } catch (error) {
    return 'dev'
  }
}

// Get git commit hash for version
function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch (error) {
    return 'dev'
  }
}

// Stamp a unique build id into the service worker's cache name so every deploy
// auto-updates the SW and purges old caches (no manual version bumping).
const BUILD_ID = `${getGitCommitHash()}-${Date.now()}`

function serviceWorkerVersionPlugin() {
  return {
    name: 'service-worker-version',
    closeBundle() {
      const swPath = path.resolve(__dirname, './dist/pwa-service-worker.js')
      try {
        const content = fs.readFileSync(swPath, 'utf8').replace(/__BUILD_ID__/g, BUILD_ID)
        fs.writeFileSync(swPath, content)
        console.log(`Service worker cache id: daggerheart-gm-${BUILD_ID}`)
      } catch (error) {
        console.warn('service-worker-version: could not patch service worker', error.message)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorkerVersionPlugin()],
  root: path.resolve(__dirname, './src'),
  base: process.env.NODE_ENV === 'production' ? '/Daggerheart-GM-Dashboard/' : '/', // GitHub Pages subdirectory only in production
  publicDir: path.resolve(__dirname, './public'), // Point to public directory relative to project root
  define: {
    __APP_VERSION__: JSON.stringify(`${getPackageVersion()} (${getGitCommitHash()})`)
  },
  server: {
    host: true, // bind all interfaces (localhost + LAN)
    // Honour the PORT the Claude Code preview assigns (its autoPort) so Vite binds to the
    // SAME port the preview then navigates to. Vite ignores PORT by default and stays on
    // 5173, so the preview would open a port nothing is serving → blank pane. With PORT set
    // we bind exactly there (strictPort); without it, fall back to 5173 and let Vite
    // increment, so multiple worktrees each running `npm run dev` don't collide.
    port: Number(process.env.PORT) || 5173,
    strictPort: !!process.env.PORT,
    // The preview attaches to the server itself — don't spawn an extra browser tab.
    open: false,
    // No fixed hmr.port: let HMR follow the dev-server port so each worktree's live-reload
    // socket is automatically isolated (the old hard-coded 5179 collided across worktrees).
    // This repo lives in a OneDrive cloud-sync folder; sync touches lock/temp files and
    // would trigger endless reloads — ignore those and debounce writes so saves settle first.
    watch: {
      ignored: ['**/.~lock*', '**/*.tmp', '**/~$*', '**/desktop.ini'],
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 }
    }
  },
  // Re-optimize deps on each dev start (moved from the now-deprecated server.force).
  optimizeDeps: { force: true },
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          dndkit: ['@dnd-kit/core','@dnd-kit/sortable','@dnd-kit/utilities'],
          fa: ['@fortawesome/fontawesome-svg-core','@fortawesome/free-solid-svg-icons','@fortawesome/react-fontawesome'],
          lucide: ['lucide-react'],
        }
      }
    }
  }
})
