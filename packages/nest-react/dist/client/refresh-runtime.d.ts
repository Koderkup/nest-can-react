import RefreshRuntime from 'react-refresh/runtime';
export declare function performReactRefresh(): {
    updatedFamilies: Set<unknown>;
    staleFamilies: Set<unknown>;
} | null;
declare global {
    interface Window {
        $RefreshReg$: (type: unknown, id: string) => void;
        $RefreshSig$: () => (type: unknown) => unknown;
        $RefreshRuntime$: typeof RefreshRuntime;
    }
}
