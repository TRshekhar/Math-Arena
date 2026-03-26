/**
 * preload.js — Electron preload script
 * Runs in a privileged context before the renderer.
 * Exposes only the specific APIs the renderer needs via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion:  ()               => ipcRenderer.invoke('get-version'),
  getAppPath:  ()               => ipcRenderer.invoke('get-app-path'),

  // File dialogs
  saveDialog:  (opts)           => ipcRenderer.invoke('save-dialog', opts),

  // Platform info (useful for platform-specific UI tweaks)
  platform:    process.platform,
  isElectron:  true,
});