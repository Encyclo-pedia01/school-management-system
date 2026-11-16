"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * A 2px bar across the top of the app that fills while something is happening:
 * a route change, or a write the person just triggered (save register, record a
 * payment, publish reports…). Actions are applied to local state immediately —
 * this is the "it worked, still syncing" signal, not a blocker.
 */

const EVENT = "sms:progress";

export function beginProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: "start" }));
}

export function endProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: "done" }));
}

/** Runs work, then lets the bar finish on its own a beat later. */
export function runWithProgress(work: () => void) {
  beginProgress();
  try {
    work();
  } finally {
    window.setTimeout(endProgress, 420);
  }
}

export default function TopProgress() {
  const pathname = usePathname();
  const [pct, setPct] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const start = () => {
    clearTimers();
    setVisible(true);
    setPct(12);
    timers.current.push(window.setTimeout(() => setPct(46), 120));
    timers.current.push(window.setTimeout(() => setPct(72), 380));
    timers.current.push(window.setTimeout(() => setPct(88), 900));
  };

  const done = () => {
    clearTimers();
    setPct(100);
    timers.current.push(
      window.setTimeout(() => {
        setVisible(false);
        setPct(0);
      }, 260),
    );
  };

  /* route changes */
  useEffect(() => {
    start();
    const t = window.setTimeout(done, 520);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* explicit begin/end from actions */
  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "start") start();
      else done();
    };
    window.addEventListener(EVENT, onEvent);
    return () => window.removeEventListener(EVENT, onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="top-progress" aria-hidden={!visible}>
      <span
        style={{
          width: `${pct}%`,
          opacity: visible ? 1 : 0,
          transition: "width 320ms ease, opacity 220ms ease",
        }}
      />
    </div>
  );
}
