import { useCallback, useState } from 'react';

/**
 * Hook that returns a persisted copy of the provided `value`. If
 * `value` becomes falsey it will return the most recent version of
 * `value`.
 */
export function useResettablePersistedValue<T>(value: T) {
   /**
    * Maintain the persisted value in state (rather than a ref) as the
    * value of ref.current shouldn't be used in rendering.
    */
   const [persistedValue, setPersistedValue] = useState<T | undefined>(
      value || undefined,
   );

   /**
    * Reset the persisted value and force a re-render.
    */
   const reset = useCallback(() => {
      setPersistedValue(undefined);
   }, []);

   /**
    * Maintain a copy of `value` in a ref to be able to persist it when
    * `value` becomes falsey.
    */
   if (value && persistedValue !== value) {
      setPersistedValue(value);
   }

   return [value || persistedValue, reset] as const;
}
