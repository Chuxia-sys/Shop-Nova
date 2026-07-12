"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether a CSS media query matches the current viewport.
 * Re-evaluates whenever the viewport changes.
 *
 * @param query - A CSS media query string (e.g. "(min-width: 768px)").
 * @returns `true` when the query matches, `false` otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia(query);

    // Set the initial value immediately
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener("change", handleChange);
    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
