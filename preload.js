const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Menu event listeners
    onNewProgram: (callback) => ipcRenderer.on('new-program', callback),
    onSaveProgram: (callback) => ipcRenderer.on('save-program', callback),
    onRunProgram: (callback) => ipcRenderer.on('run-program', callback),
    onStepProgram: (callback) => ipcRenderer.on('step-program', callback),
    onPauseProgram: (callback) => ipcRenderer.on('pause-program', callback),
    onResetProgram: (callback) => ipcRenderer.on('reset-program', callback),
    onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
    
    // Platform info
    platform: process.platform,
    isElectron: true
});
