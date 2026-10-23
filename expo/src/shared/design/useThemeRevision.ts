import { useSyncExternalStore } from 'react';
import { subscribeTheme, themeSnapshot } from './themeRuntime';
/** Each visual component subscribes, including memoized leaves and inline token styles. */
export function useThemeRevision() { return useSyncExternalStore(subscribeTheme, themeSnapshot, themeSnapshot); }
