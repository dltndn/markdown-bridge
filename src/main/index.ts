import { app, BrowserWindow } from "electron";
import { createMainWindow } from "./app/window";
import { createMainLogger } from "./logging";
import { registerIpcHandlers } from "./ipc/register";

const logger = createMainLogger({ consoleEnabled: !app.isPackaged });

async function bootstrap(): Promise<void> {
  await app.whenReady();
  logger.info("app:startup", {
    packaged: app.isPackaged,
    platform: process.platform
  });

  const mainWindow = createMainWindow();
  registerIpcHandlers(mainWindow, logger);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const nextWindow = createMainWindow();
      registerIpcHandlers(nextWindow, logger);
    }
  });
}

process.on("exit", (exitCode) => {
  logger.info("process:exit", { exitCode });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    logger.info("app:window_all_closed", { platform: process.platform });
    app.quit();
  }
});

void bootstrap();
