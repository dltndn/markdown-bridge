import { contextBridge, ipcRenderer } from "electron";
import type { ConversionRequest, JobUpdateEvent, MarkdownBridgeApi } from "../shared/contracts";

const api: MarkdownBridgeApi = {
  getEnvironmentStatus: () => ipcRenderer.invoke("app:getEnvironmentStatus"),
  pickFiles: () => ipcRenderer.invoke("dialog:pickFiles"),
  pickOutputDirectory: () => ipcRenderer.invoke("dialog:pickOutputDirectory"),
  openOutputFolder: (outputPath: string) => ipcRenderer.invoke("dialog:openOutputFolder", outputPath),
  openExternalUrl: (url: string) => ipcRenderer.invoke("app:openExternalUrl", url),
  getCapabilities: () => ipcRenderer.invoke("conversion:getCapabilities"),
  createJob: (request: ConversionRequest) => ipcRenderer.invoke("conversion:createJob", request),
  getJob: (jobId: string) => ipcRenderer.invoke("conversion:getJob", jobId),
  listJobs: () => ipcRenderer.invoke("conversion:listJobs"),
  onJobUpdated: (listener) => {
    const subscription = (_event: Electron.IpcRendererEvent, payload: JobUpdateEvent) => {
      listener(payload);
    };

    ipcRenderer.on("conversion:subscribe", subscription);
    return () => {
      ipcRenderer.removeListener("conversion:subscribe", subscription);
    };
  }
};

contextBridge.exposeInMainWorld("markdownBridge", api);
