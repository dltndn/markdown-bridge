import { BrowserWindow, dialog, ipcMain } from "electron";
import type { ConversionRequest, JobUpdateEvent } from "../../shared/contracts";
import { getConversionCapabilities } from "../services/capabilities";
import { ConversionService } from "../services/conversion-service";
import { JobStore } from "../services/job-store";
import { EnvironmentService } from "../system/environment";

export function registerIpcHandlers(mainWindow: BrowserWindow): ConversionService {
  const environmentService = new EnvironmentService();
  const conversionService = new ConversionService(environmentService, new JobStore());

  registerHandle("app:getEnvironmentStatus", async () => environmentService.getStatus());
  registerHandle("dialog:pickFiles", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Supported documents", extensions: ["md", "docx", "pdf"] }
      ]
    });

    return result.canceled ? [] : result.filePaths;
  });
  registerHandle("dialog:pickOutputDirectory", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"]
    });

    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  registerHandle("conversion:getCapabilities", async () => getConversionCapabilities());
  registerHandle("conversion:createJob", async (_event, request: ConversionRequest) => conversionService.createJob(request));
  registerHandle("conversion:getJob", async (_event, jobId: string) => conversionService.getJob(jobId));
  registerHandle("conversion:listJobs", async () => conversionService.listJobs());

  conversionService.subscribe((event: JobUpdateEvent) => {
    mainWindow.webContents.send("conversion:jobUpdated", event);
  });

  return conversionService;
}

function registerHandle(channel: string, listener: Parameters<typeof ipcMain.handle>[1]): void {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, listener);
}
