import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobUpdateEvent, MarkdownBridgeApi } from "../../src/shared/contracts";

type Subscription = (event: unknown, payload: JobUpdateEvent) => void;

const electronMocks = vi.hoisted(() => {
  let exposedApi: unknown = null;
  let subscribedListener: Subscription | null = null;

  return {
    getExposedApi: () => exposedApi,
    getSubscribedListener: () => subscribedListener,
    contextBridge: {
      exposeInMainWorld: vi.fn((_, api) => {
        exposedApi = api;
      })
    },
    ipcRenderer: {
      invoke: vi.fn(),
      on: vi.fn((channel: string, listener: Subscription) => {
        if (channel === "conversion:subscribe") {
          subscribedListener = listener;
        }
      }),
      removeListener: vi.fn((channel: string, listener: Subscription) => {
        if (channel === "conversion:subscribe" && subscribedListener === listener) {
          subscribedListener = null;
        }
      })
    }
  };
});

vi.mock("electron", () => ({
  contextBridge: electronMocks.contextBridge,
  ipcRenderer: electronMocks.ipcRenderer
}));

import "../../src/preload/index";

describe("preload subscription bridge", () => {
  beforeEach(() => {
    electronMocks.contextBridge.exposeInMainWorld.mockClear();
    electronMocks.ipcRenderer.invoke.mockClear();
    electronMocks.ipcRenderer.on.mockClear();
    electronMocks.ipcRenderer.removeListener.mockClear();
  });

  it("subscribes to conversion:subscribe and forwards JobUpdateEvent payloads", () => {
    const api = electronMocks.getExposedApi() as MarkdownBridgeApi;
    const receivedEvents: JobUpdateEvent[] = [];
    const unsubscribe = api.onJobUpdated((event) => {
      receivedEvents.push(event);
    });

    expect(electronMocks.ipcRenderer.on).toHaveBeenCalledWith("conversion:subscribe", expect.any(Function));

    const subscription = electronMocks.getSubscribedListener();
    expect(subscription).not.toBeNull();

    const payload: JobUpdateEvent = {
      job: {
        id: "job-1",
        items: [],
        summary: {
          total: 0,
          queued: 0,
          processing: 0,
          success: 0,
          failed: 0,
          skipped: 0
        }
      },
      itemId: "item-1"
    };

    subscription?.({}, payload);

    expect(receivedEvents).toEqual([payload]);

    unsubscribe();

    expect(electronMocks.ipcRenderer.removeListener).toHaveBeenCalledWith("conversion:subscribe", subscription);
    expect(electronMocks.getSubscribedListener()).toBeNull();
  });
});
