"use client";

import { useEffect, useState } from "react";

/**
 * prefers-reduced-motion without a hydration mismatch.
 *
 * motion's useReducedMotion reads the real value during the first client
 * render, while the server rendered `false` — React then reports every style
 * that differs. This starts at `false` on both sides and flips in an effect,
 * so the markup always matches; reduced-motion users get one extra frame of
 * the animated markup before it settles, which they never see move.
 */
export default function useReducedMotionSafe() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}
