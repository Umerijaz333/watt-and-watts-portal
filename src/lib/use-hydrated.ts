"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false during SSR and before hydration, true once React is interactive. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
