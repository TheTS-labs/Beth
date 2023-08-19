import { MutableRefObject, useEffect } from "react";

export default function useOutside(ref: MutableRefObject<any>, callback: Function, args: any[]) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback(...args);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
}