import { useEffect } from "react";
import type { JobUpdateEvent } from "../../shared/contracts";

export function useJobSubscription(listener: (event: JobUpdateEvent) => void): void {
  useEffect(() => window.markdownBridge.onJobUpdated(listener), [listener]);
}

