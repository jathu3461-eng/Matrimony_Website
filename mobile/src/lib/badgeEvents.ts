type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export const badgeEvents = {
  on(event: string, fn: Listener) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(fn);
    return () => { listeners.get(event)?.delete(fn); };
  },
  emit(event: string) {
    listeners.get(event)?.forEach((fn) => fn());
  },
};
