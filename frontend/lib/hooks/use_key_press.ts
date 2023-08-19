import { useEffect } from "react";

export default function useKeyPress(key: string, callback: Function, args: any[]) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (key == event.key) {
        callback(...args);
      }
    }

    document.addEventListener("keydown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleClickOutside);
    };
  }, []);
}