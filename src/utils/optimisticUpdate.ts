import type { Dispatch, SetStateAction } from "react";

/**
 * Applies an optimistic state update and returns a `revert()` function.
 *
 * The snapshot is captured inside the setter callback so it is always
 * consistent with the state at the moment of the call.
 *
 * Usage:
 *   const revert = applyOptimistic(setStudent, prev => ({ ...prev, coins: prev.coins - cost }));
 *   const { error } = await someAsyncOp();
 *   if (error) revert();
 */
export function applyOptimistic<T>(
  setter: Dispatch<SetStateAction<T>>,
  update: (prev: T) => T,
): () => void {
  let snapshot: T | undefined;

  setter(prev => {
    snapshot = prev;
    return update(prev);
  });

  return () => {
    if (snapshot !== undefined) setter(snapshot);
  };
}
