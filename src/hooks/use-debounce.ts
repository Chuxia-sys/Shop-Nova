"use client";

import { useEffect, useState } from "react";

/**
 * Debounces a value by the specified delay.
 * Useful for delaying search queries, resize handlers, etc.
 *
 * @param value - The value to debounce.
 * @param delay - The debounce delay in milliseconds (default: 500).
 * @returns The debounced value, updated only after the delay has elapsed since the last change.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
