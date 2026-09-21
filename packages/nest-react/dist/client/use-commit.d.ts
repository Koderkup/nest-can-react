export type CommitState = 'idle' | 'submitting' | 'revalidating';
type UseCommitOptions = {
    method?: string;
    revalidate?: boolean;
};
export declare function useCommit<T = unknown>(url: string, options?: UseCommitOptions): {
    commit: (body?: unknown) => Promise<T | undefined>;
    data: T | undefined;
    error: Error | null;
    pending: boolean;
    state: CommitState;
};
export {};
