import { useCallback, useEffect, useReducer, useRef } from 'react';

/**
 * Hook that returns a persisted copy of the provided `value`. If
 * `value` becomes falsey it will return the most recent version of
 * `value`.
 */
export function useResettablePersistedValue<T>(value: T) {
   const persistedValue = useRef<T | undefined>(value || undefined);

   const [, reRender] = useReducer((prev) => prev + 1, 0);

   const reset = useCallback(() => {
      const hasPersistedValue = !!persistedValue.current;
      persistedValue.current = undefined;
      if (hasPersistedValue) {
         reRender();
      }
   }, []);

   /**
    * Maintain a copy of `value` in a ref to be able to persist it when
    * `value` becomes falsey.
    */
   useEffect(() => {
      if (value) {
         persistedValue.current = value;
      }
   }, [value]);

   return [value || persistedValue.current, reset] as const;
}
