type CommitPayload<T> = {
  data?: T;
  revalidate: string[];
};

type Revalidation = {
  __nestReactRevalidate: true;
  keys: string[];
};

export type CommitHandler<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => TResult | Revalidation | Promise<TResult | Revalidation>;

export function revalidate(...keys: string[]): Revalidation {
  return {
    __nestReactRevalidate: true,
    keys,
  };
}

export function commit<TArgs extends unknown[], TResult>(
  handler: CommitHandler<TArgs, TResult>,
) {
  return async (...args: TArgs): Promise<CommitPayload<TResult>> => {
    const result = await handler(...args);

    if (isRevalidation(result)) {
      return {
        revalidate: result.keys,
      };
    }

    return {
      data: result,
      revalidate: [],
    };
  };
}

function isRevalidation(value: unknown): value is Revalidation {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__nestReactRevalidate' in value &&
    (value as Revalidation).__nestReactRevalidate === true
  );
}
