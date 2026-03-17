import { app, BrowserWindow } from "electron";
import { createMainWindow } from "./app/window";
import { registerIpcHandlers } from "./ipc/register";

async function bootstrap(): Promise<void> {
  await app.whenReady();

  const mainWindow = createMainWindow();
  registerIpcHandlers(mainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const nextWindow = createMainWindow();
      registerIpcHandlers(nextWindow);
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

void bootstrap();
