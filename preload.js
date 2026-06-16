const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  analyze:              (params) => ipcRenderer.invoke('api:analyze', params),
  getFeatures:          (params) => ipcRenderer.invoke('api:getFeatures', params),
  getFeatureById:       (params) => ipcRenderer.invoke('api:getFeatureById', params),
  getCodeFlow:          (params) => ipcRenderer.invoke('api:getCodeFlow', params),
  getBusinessFlows:     (params) => ipcRenderer.invoke('api:getBusinessFlows', params),
  getBusinessFlowById:  (params) => ipcRenderer.invoke('api:getBusinessFlowById', params),
  generateQuestions:    (params) => ipcRenderer.invoke('api:generateQuestions', params),
  getAnalysisRuns:      (params) => ipcRenderer.invoke('api:getAnalysisRuns', params),
  getFewShots:          (params) => ipcRenderer.invoke('api:getFewShots', params),
  createFewShot:        (params) => ipcRenderer.invoke('api:createFewShot', params),
});

contextBridge.exposeInMainWorld('dialog', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
});

contextBridge.exposeInMainWorld('shell', {
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),
});

// ── Graph: Local Codebase Scanner + File Reader ───────────────────────────────
contextBridge.exposeInMainWorld('graphApi', {
  /** Scan a local directory for source files and extract import edges. */
  scanLocal: (folderPath) => ipcRenderer.invoke('graph:scanLocal', folderPath),
  /** Read the text content of a source file. */
  readFile:  (filePath)   => ipcRenderer.invoke('graph:readFile',  filePath),
});
