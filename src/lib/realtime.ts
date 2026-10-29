type Listener = (event: RealtimeEvent) => void;

export type RealtimeEvent = {
  type:
    | "order.created"
    | "order.updated"
    | "alert.created"
    | "alert.updated"
    | "session.updated"
    | "payment.updated";
  restaurantId: string;
  payload: unknown;
  at: string;
};

/**
 * Bus en memoria para SSE (una instancia Node).
 * En multi-instancia / serverless conviene Redis o un servicio hosted;
 * esta API se mantiene igual.
 */
class RealtimeBus {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(restaurantId: string, listener: Listener): () => void {
    const set = this.listeners.get(restaurantId) || new Set();
    set.add(listener);
    this.listeners.set(restaurantId, set);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(restaurantId);
    };
  }

  publish(event: Omit<RealtimeEvent, "at">) {
    const full: RealtimeEvent = { ...event, at: new Date().toISOString() };
    const set = this.listeners.get(event.restaurantId);
    if (!set) return;
    for (const l of set) {
      try {
        l(full);
      } catch {
        /* ignore */
      }
    }
  }
}

const globalForRt = globalThis as unknown as { tapmenuRt?: RealtimeBus };
export const realtime = globalForRt.tapmenuRt || new RealtimeBus();
if (process.env.NODE_ENV !== "production") globalForRt.tapmenuRt = realtime;
