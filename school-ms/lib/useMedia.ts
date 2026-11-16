"use client";

import { useEffect, useState } from "react";

/** True on phone-sized viewports. Starts false so server and first client render agree. */
export function useIsPhone(maxWidth = 720) {
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [maxWidth]);

  return phone;
}

/** GH₵195,810 → GH₵195.8k, so a headline number fits a half-width card on a phone. */
export function compactMoney(value: number, symbol = "GH₵") {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
  if (abs >= 10_000) return `${symbol}${(value / 1000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return `${symbol}${Math.round(value).toLocaleString("en-GB")}`;
}
