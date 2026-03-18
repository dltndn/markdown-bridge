import { afterEach, describe, expect, it, vi } from "vitest";
import { createMainLogger } from "../../src/main/logging";

describe("createMainLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits structured log entries and forwards them to the console in development", () => {
    const sink = vi.fn();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const logger = createMainLogger({
      consoleEnabled: true,
      now: () => "2026-03-18T00:00:00.000Z",
      sink
    });

    logger.info("app:startup", {
      packaged: false,
      platform: "darwin"
    });

    expect(sink).toHaveBeenCalledWith({
      level: "info",
      scope: "main",
      event: "app:startup",
      timestamp: "2026-03-18T00:00:00.000Z",
      details: {
        packaged: false,
        platform: "darwin"
      }
    });
    expect(infoSpy).toHaveBeenCalledWith({
      level: "info",
      scope: "main",
      event: "app:startup",
      timestamp: "2026-03-18T00:00:00.000Z",
      details: {
        packaged: false,
        platform: "darwin"
      }
    });
  });
});
