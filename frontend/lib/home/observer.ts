import { MutableRefObject } from "react";

export default (observerTarget: MutableRefObject<any>, callback: Function, args: any[]) => {
  return () => {
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
  
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    }; 
  };
}