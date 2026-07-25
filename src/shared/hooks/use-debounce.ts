import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delayMs` — updates only after the value has
 * stopped changing for that long. Used to throttle search input, resize, etc.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
