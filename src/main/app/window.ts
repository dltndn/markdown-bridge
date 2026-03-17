import { app, BrowserWindow } from "electron";
import path from "node:path";

const RENDERER_DEV_URL = "http://localhost:5173";

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#f4efe6",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.resolve(__dirname, "../../preload/index.js")
    }
  });

  if (!app.isPackaged) {
    void window.loadURL(RENDERER_DEV_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    void window.loadFile(path.resolve(__dirname, "../../renderer/index.html"));
  }

  return window;
}
