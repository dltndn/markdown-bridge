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

  it("redacts document body-like fields before emitting log entries", () => {
    const sink = vi.fn();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const logger = createMainLogger({
      consoleEnabled: true,
      now: () => "2026-03-18T00:00:00.000Z",
      sink
    });

    const details = {
      jobId: "job-1",
      content: "## secret markdown",
      document: {
        body: "full document text",
        metadata: {
          title: "Example"
        }
      },
      items: [
        {
          name: "first",
          markdown: "# hidden source"
        }
      ]
    };

    logger.warn("job:item_failed", details);

    expect(details).toEqual({
      jobId: "job-1",
      content: "## secret markdown",
      document: {
        body: "full document text",
        metadata: {
          title: "Example"
        }
      },
      items: [
        {
          name: "first",
          markdown: "# hidden source"
        }
      ]
    });
    expect(sink).toHaveBeenCalledWith({
      level: "warn",
      scope: "main",
      event: "job:item_failed",
      timestamp: "2026-03-18T00:00:00.000Z",
      details: {
        jobId: "job-1",
        content: "[redacted]",
        document: {
          body: "[redacted]",
          metadata: {
            title: "Example"
          }
        },
        items: [
          {
            name: "first",
            markdown: "[redacted]"
          }
        ]
      }
    });
    expect(warnSpy).toHaveBeenCalledWith({
      level: "warn",
      scope: "main",
      event: "job:item_failed",
      timestamp: "2026-03-18T00:00:00.000Z",
      details: {
        jobId: "job-1",
        content: "[redacted]",
        document: {
          body: "[redacted]",
          metadata: {
            title: "Example"
          }
        },
        items: [
          {
            name: "first",
            markdown: "[redacted]"
          }
        ]
      }
    });
  });
});
