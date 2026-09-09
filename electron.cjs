/**
 * Math Arena — Electron Main Process
 *
 * Works in two modes:
 *   Dev:        npm run electron-dev   (loads from Vite at localhost:5173)
 *   Production: npm run dist           (loads from dist/index.html via file://)
 *
 * The game server (Socket.io on port 3001) starts automatically in both modes.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// ── Determine paths ──────────────────────────────────────────────────────────
// In a packaged app, __dirname is inside the asar archive (or resources/app/).
// app.getAppPath() always returns the correct root in both dev and production.
const APP_ROOT  = app.getAppPath();
const isDev     = !app.isPackaged;

// ── Start game server ────────────────────────────────────────────────────────
// Must be required with an absolute path so it works when packaged.
let gameServer = null;
function startGameServer() {
  try {
    const serverPath = path.join(APP_ROOT, 'server', 'server.js');
    const { startServer } = require(serverPath);
    gameServer = startServer();
    console.log('[Electron] ✅ Game server started on port 3002');
  } catch (err) {
    console.error('[Electron] ❌ Game server failed:', err.message);
    // Non-fatal — app still launches, QR mode just won't work
  }
}

// ── Window ────────────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          820,
    minWidth:        960,
    minHeight:       640,
    title:           'Math Arena',
    icon:            path.join(APP_ROOT, 'public', 'favicon.ico'),
    backgroundColor: '#060f1e',   // matches BG_DARK — no white flash on load
    show:            false,       // show only when ready (prevents blank frame)
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          false,    // needed for preload to use require
    },
  });

  // Remove default menu bar (keeps UI clean for a game)
  mainWindow.setMenuBarVisibility(false);

  // Load the app
  if (isDev) {
    // Dev: Vite dev server with HMR
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load built files via file:// protocol
    mainWindow.loadFile(path.join(APP_ROOT, 'dist', 'index.html'));
  }

  // Show window once content is ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── IPC handlers (called from preload → renderer) ────────────────────────────
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => APP_ROOT);

// Allow renderer to open a "Save questions" dialog for export
ipcMain.handle('save-dialog', async (_, { defaultPath, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, { defaultPath, filters });
  return result;
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startGameServer();
  createWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon clicked and no windows open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  // Gracefully close the game server if it's running
  if (gameServer?.server) {
    try { gameServer.server.close(); } catch {}
  }
});