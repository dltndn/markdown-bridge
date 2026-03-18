import type { BrowserWindow } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";

type IpcHandler = (event: unknown, ...args: unknown[]) => unknown | Promise<unknown>;

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, IpcHandler>();

  return {
    handlers,
    handle: vi.fn((channel: string, listener: IpcHandler) => {
      handlers.set(channel, listener);
    }),
    removeHandler: vi.fn((channel: string) => {
      handlers.delete(channel);
    }),
    showOpenDialog: vi.fn(),
    openPath: vi.fn()
  };
});

vi.mock("electron", () => ({
  dialog: {
    showOpenDialog: electronMocks.showOpenDialog
  },
  shell: {
    openPath: electronMocks.openPath
  },
  ipcMain: {
    handle: electronMocks.handle,
    removeHandler: electronMocks.removeHandler
  }
}));

import { registerIpcHandlers } from "../../src/main/ipc/register";

function invokeRegisteredHandler(channel: string, ...args: unknown[]): Promise<unknown> {
  const handler = electronMocks.handlers.get(channel);

  if (!handler) {
    throw new Error(`Missing IPC handler for channel: ${channel}`);
  }

  return Promise.resolve(handler({}, ...args));
}

describe("registerIpcHandlers", () => {
  beforeEach(() => {
    electronMocks.handlers.clear();
    electronMocks.handle.mockClear();
    electronMocks.removeHandler.mockClear();
    electronMocks.showOpenDialog.mockReset();
  });

  it("serves conversion:createJob, conversion:getJob, and conversion:listJobs through the IPC surface", async () => {
    const mainWindow = {
      webContents: {
        send: vi.fn()
      }
    } as unknown as BrowserWindow;

    registerIpcHandlers(mainWindow);

    expect(electronMocks.handle.mock.calls.map(([channel]) => channel)).toEqual(
      expect.arrayContaining([
        "app:getEnvironmentStatus",
        "dialog:pickFiles",
        "dialog:pickOutputDirectory",
        "dialog:openOutputFolder",
        "conversion:getCapabilities",
        "conversion:createJob",
        "conversion:getJob",
        "conversion:listJobs"
      ])
    );

    const request = {
      inputPaths: ["/tmp/sample.docx"],
      targetFormat: "pdf",
      outputDirectory: "/tmp/out",
      collisionPolicy: "rename"
    } as const;

    const createdJob = await invokeRegisteredHandler("conversion:createJob", request);

    expect(createdJob).toMatchObject({
      summary: {
        total: 1,
        queued: 0,
        processing: 0,
        success: 0,
        failed: 1,
        skipped: 0
      },
      items: [
        expect.objectContaining({
          inputPath: "/tmp/sample.docx",
          inputFormat: "docx",
          targetFormat: "pdf",
          status: "failed",
          errorCode: "unsupported_conversion_path",
          errorMessage: "This conversion path is not available in the current MVP scaffold.",
          errorDetails: null
        })
      ]
    });

    const fetchedJob = await invokeRegisteredHandler("conversion:getJob", (createdJob as { id: string }).id);
    expect(fetchedJob).toMatchObject({
      id: (createdJob as { id: string }).id,
      summary: {
        total: 1,
        queued: 0,
        processing: 0,
        success: 0,
        failed: 1,
        skipped: 0
      }
    });

    const jobList = await invokeRegisteredHandler("conversion:listJobs");
    expect(jobList).toEqual([expect.objectContaining({ id: (createdJob as { id: string }).id })]);
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      "conversion:subscribe",
      expect.objectContaining({
        job: expect.objectContaining({
          id: (createdJob as { id: string }).id
        })
      })
    );

    await invokeRegisteredHandler("dialog:openOutputFolder", "/tmp/out/sample.pdf");
    expect(electronMocks.openPath).toHaveBeenCalledWith("/tmp/out");
  });
});
