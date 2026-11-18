import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** False during server rendering and hydration, true afterwards. */
export const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);
