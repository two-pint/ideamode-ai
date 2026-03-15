import { useEffect, useRef } from "react";

export function useDebounce(
  value: string,
  delay: number,
  callback: (value: string) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const id = setTimeout(() => callbackRef.current(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
}
