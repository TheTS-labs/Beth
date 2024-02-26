/* eslint-disable @typescript-eslint/no-explicit-any */
import { MutableRefObject, useEffect } from "react";


export default function useOutside(
  ref: MutableRefObject<HTMLDivElement | null>,
  callback: (...args: any[]) => any,
  args: any[]
): void {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(...args);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, args, callback]);
}