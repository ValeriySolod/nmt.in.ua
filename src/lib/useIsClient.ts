import { useSyncExternalStore } from "react";

function subscribeNever() {
  return () => {};
}

export function useIsClient() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}
