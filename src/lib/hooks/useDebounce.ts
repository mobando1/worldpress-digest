"use client";

import { useEffect, useState } from "react";

/**
 * Debounce a rapidly-changing value.
 *
 * Returns the latest value only after `delay` ms of inactivity.
 * Useful for search inputs where you want to avoid firing a request on
 * every keystroke.
 *
 * @param value  The value to debounce.
 * @param delay  Debounce window in milliseconds (default 300).
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
