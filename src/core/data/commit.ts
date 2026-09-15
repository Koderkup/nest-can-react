type CommitPayload<T> = {
  data?: T;
  revalidate: string[];
};

export type CommitRef = {
  __nr_commit: string;
};

type Revalidation = {
  __nestReactRevalidate: true;
  keys: string[];
};

export type CommitHandler<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => TResult | Revalidation | Promise<TResult | Revalidation>;

export type CommitDefinition<TArgs extends unknown[], TResult> = {
  id: string;
  ref: CommitRef;
  (...args: TArgs): Promise<CommitPayload<TResult>>;
};

const commitRegistry = new Map<string, CommitDefinition<unknown[], unknown>>();
let nextCommitId = 0;

export function revalidate(...keys: string[]): Revalidation {
  return {
    __nestReactRevalidate: true,
    keys,
  };
}

export function commit<TArgs extends unknown[], TResult>(
  id: string,
  handler: CommitHandler<TArgs, TResult>,
): CommitDefinition<TArgs, TResult>;
export function commit<TArgs extends unknown[], TResult>(
  handler: CommitHandler<TArgs, TResult>,
): CommitDefinition<TArgs, TResult>;
export function commit<TArgs extends unknown[], TResult>(
  idOrHandler: string | CommitHandler<TArgs, TResult>,
  maybeHandler?: CommitHandler<TArgs, TResult>,
): CommitDefinition<TArgs, TResult> {
  const id =
    typeof idOrHandler === 'string' ? idOrHandler : `commit:${nextCommitId++}`;
  const handler = typeof idOrHandler === 'string' ? maybeHandler : idOrHandler;

  if (!handler) {
    throw new Error(`No commit handler registered for "${id}".`);
  }

  const commitDefinition = async (
    ...args: TArgs
  ): Promise<CommitPayload<TResult>> => {
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

  const namedCommit = Object.assign(commitDefinition, {
    id,
    ref: { __nr_commit: id },
  });

  commitRegistry.set(id, namedCommit as CommitDefinition<unknown[], unknown>);

  return namedCommit;
}

export async function executeCommit(id: string, args: unknown[]) {
  const commitDefinition = commitRegistry.get(id);

  if (!commitDefinition) {
    throw new Error(`No commit() registered for id "${id}".`);
  }

  return commitDefinition(...args);
}

function isRevalidation(value: unknown): value is Revalidation {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__nestReactRevalidate' in value &&
    (value as Revalidation).__nestReactRevalidate === true
  );
}
