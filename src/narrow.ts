import { useEffect, useState } from "react";

export const NARROW_QUERY = "(max-width: 860px)";

export function isNarrowViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches;
}

export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(isNarrowViewport);

  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return narrow;
}
