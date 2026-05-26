import { useState, useEffect } from "react";

/**
 * Debounce a value by a delay (default 300ms).
 * Returns the debounced value that only updates after the delay.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
