/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";

export default function useKeyPress(key: string, callback: (...args: any[]) => any, args: any[]): void {
  useEffect(() => {
    function handleClickOutside(event: KeyboardEvent): void {
      if (key == event.key) {
        callback(...args);
      }
    }

    document.addEventListener("keydown", handleClickOutside);
    return (): void => {
      document.removeEventListener("keydown", handleClickOutside);
    };
  }, [args, callback, key]);
}