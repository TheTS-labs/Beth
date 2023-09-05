/* eslint-disable @typescript-eslint/no-explicit-any */
import { MutableRefObject } from "react";

export default function observer(
  observerTarget: MutableRefObject<any>,
  callback: (...args: any[]) => any,
  args: any[]
): () => () => void {
  return (): () => void => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          callback(...args);
        }
      }, { threshold: 1 }
    );
  
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
  
    return (): void => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    }; 
  };
}