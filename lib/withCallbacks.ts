type Callbacks<T, R = unknown> = {
  onStart?: () => R;
  onEnd?: (reference: R) => void;
  onSuccess?: (result: T) => void;
  onError?: (result: T) => void;
};

interface WithSucceeded {
  succeeded?: boolean;
}

export const withCallbacks = <Args extends unknown[], T extends WithSucceeded>(
  fn: (...args: Args) => Promise<T>,
  callbacks?: Callbacks<T>
): ((...args: Args) => Promise<T>) => {
  return async (...args: Args): Promise<T> => {
    const promise = fn(...args);

    const reference = callbacks?.onStart?.();
    const result = await promise;

    if (reference) {
      callbacks?.onEnd?.(reference);
    }

    if (result?.succeeded) {
      callbacks?.onSuccess?.(result);
    }

    if (!result?.succeeded) {
      callbacks?.onError?.(result);
    }

    return promise;
  };
};
