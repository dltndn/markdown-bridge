import type { MarkdownBridgeApi } from "../../shared/contracts";

declare global {
  interface Window {
    markdownBridge: MarkdownBridgeApi;
  }
}

export {};

