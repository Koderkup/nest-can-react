/// <reference lib="dom" />
import RefreshRuntime from 'react-refresh/runtime';

RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => undefined;
window.$RefreshSig$ = () => (type) => type;
window.$RefreshRuntime$ = RefreshRuntime;

export function performReactRefresh() {
  return RefreshRuntime.performReactRefresh();
}

declare global {
  interface Window {
    $RefreshReg$: (type: unknown, id: string) => void;
    $RefreshSig$: () => (type: unknown) => unknown;
    $RefreshRuntime$: typeof RefreshRuntime;
  }
}
