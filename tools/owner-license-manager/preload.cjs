'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tolueLicenseManager', Object.freeze({
  choosePrivateKey: () => ipcRenderer.invoke('tolue-lm:choose-key:v1'),
  issueLicense: input => ipcRenderer.invoke('tolue-lm:issue:v1', input),
  metadata: () => ipcRenderer.invoke('tolue-lm:metadata:v1'),
}));
