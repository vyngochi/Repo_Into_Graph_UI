const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  analyze:                    (params) => ipcRenderer.invoke('api:analyze', params),
  getFeatures:                (params) => ipcRenderer.invoke('api:getFeatures', params),
  getFeatureById:             (params) => ipcRenderer.invoke('api:getFeatureById', params),
  getFeaturesByAnalysisRunId: (params) => ipcRenderer.invoke('api:getFeaturesByAnalysisRunId', params),
  getCodeFlow:                (params) => ipcRenderer.invoke('api:getCodeFlow', params),
  getBusinessFlows:           (params) => ipcRenderer.invoke('api:getBusinessFlows', params),
  getBusinessFlowById:        (params) => ipcRenderer.invoke('api:getBusinessFlowById', params),
  generateQuestions:          (params) => ipcRenderer.invoke('api:generateQuestions', params),
  getAnalysisRuns:            (params) => ipcRenderer.invoke('api:getAnalysisRuns', params),
  getAnalysisRunById:         (params) => ipcRenderer.invoke('api:getAnalysisRunById', params),
  createAnalysisRun:          (params) => ipcRenderer.invoke('api:createAnalysisRun', params),
  updateAnalysisRun:          (params) => ipcRenderer.invoke('api:updateAnalysisRun', params),
  getFewShots:                (params) => ipcRenderer.invoke('api:getFewShots', params),
  getFewShotById:             (params) => ipcRenderer.invoke('api:getFewShotById', params),
  createFewShot:              (params) => ipcRenderer.invoke('api:createFewShot', params),
  updateFewShot:              (params) => ipcRenderer.invoke('api:updateFewShot', params),
  deleteFewShot:              (params) => ipcRenderer.invoke('api:deleteFewShot', params),
  getBusinessGraph:           (params) => ipcRenderer.invoke('api:getBusinessGraph', params),
  assessFromResponse:         (params) => ipcRenderer.invoke('api:assessFromResponse', params),
  assessAccuracy:             (params) => ipcRenderer.invoke('api:assessAccuracy', params),
  assessDifficulty:           (params) => ipcRenderer.invoke('api:assessDifficulty', params),
  highlightGraph:             (params) => ipcRenderer.invoke('api:highlightGraph', params),
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
