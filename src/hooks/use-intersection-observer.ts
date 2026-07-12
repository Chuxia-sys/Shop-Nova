"use client";

import { useCallback, useRef, useState } from "react";

export interface UseIntersectionObserverResult {
  /** Ref callback to attach to the observed element. */
  ref: (node: Element | null) => void;
  /** Whether the element is currently intersecting the viewport. */
  isIntersecting: boolean;
  /** The raw IntersectionObserverEntry, if available. */
  entry: IntersectionObserverEntry | null;
}

/**
 * Observes whether an element is visible within the viewport (or a scroll container)
 * using the Intersection Observer API.
 *
 * @param options - Standard IntersectionObserverInit options (root, rootMargin, threshold).
 * @returns An object containing a `ref` callback, `isIntersecting` boolean, and `entry`.
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
): UseIntersectionObserverResult {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      // Clean up the previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) {
        setIsIntersecting(false);
        setEntry(null);
        return;
      }

      observerRef.current = new IntersectionObserver(
        ([observedEntry]) => {
          setIsIntersecting(observedEntry.isIntersecting);
          setEntry(observedEntry);
        },
        {
          root: options?.root ?? null,
          rootMargin: options?.rootMargin ?? "0px",
          threshold: options?.threshold ?? 0,
        }
      );

      observerRef.current.observe(node);
    },
    [options?.root, options?.rootMargin, options?.threshold]
  );

  return { ref, isIntersecting, entry };
}
