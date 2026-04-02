import { useMemo, type DependencyList } from 'react';

// A simple wrapper around useMemo to make its purpose clear in the context of Firebase.
export function useMemoizedFirebase<T>(factory: () => T, deps: DependencyList | undefined): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
