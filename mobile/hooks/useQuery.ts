import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Runs an async fetcher, exposes { data, loading, error, refetch }.
 * Refetches automatically when the screen regains focus.
 * `deps` controls when the fetcher identity changes (e.g. [id]).
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  options: { refetchOnFocus?: boolean } = {}
): QueryState<T> {
  const { refetchOnFocus = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  const run = useCallback(async () => {
    setError(null);
    try {
      const result = await stableFetcher();
      if (mounted.current) setData(result);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [stableFetcher]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    run();
    return () => {
      mounted.current = false;
    };
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus) run();
    }, [run, refetchOnFocus])
  );

  return { data, loading, error, refetch: run };
}

interface MutationState<TArgs, TResult> {
  mutate: (args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: string | null;
}

/** Wraps an async action with loading/error state. Throws on error so callers can catch too. */
export function useMutation<TArgs, TResult>(
  action: (args: TArgs) => Promise<TResult>
): MutationState<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (args: TArgs) => {
      setLoading(true);
      setError(null);
      try {
        return await action(args);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Action failed';
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [action]
  );

  return { mutate, loading, error };
}
