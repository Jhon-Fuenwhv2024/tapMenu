"use client";

import { useEffect, useRef } from "react";
import type { RealtimeEvent } from "@/lib/realtime";

export function useRealtime(
  restaurantId: string | undefined,
  onEvent: (event: RealtimeEvent) => void
) {
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    if (!restaurantId) return;
    const es = new EventSource(`/api/events/${restaurantId}`);
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as RealtimeEvent;
        if (data.type) cb.current(data);
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [restaurantId]);
}
