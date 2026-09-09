import { contextBridge, ipcRenderer } from 'electron';
import { createTolueBridge } from './tolueBridge';
contextBridge.exposeInMainWorld('tolue', createTolueBridge((channel, payload) => ipcRenderer.invoke(channel, payload)));
