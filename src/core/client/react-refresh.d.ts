declare module 'react-refresh/runtime' {
  type RefreshRuntime = {
    injectIntoGlobalHook: (target: unknown) => void;
    performReactRefresh: () => {
      updatedFamilies: Set<unknown>;
      staleFamilies: Set<unknown>;
    } | null;
    register: (type: unknown, id: string) => void;
    isLikelyComponentType: (type: unknown) => boolean;
  };

  const runtime: RefreshRuntime;
  export default runtime;
}
