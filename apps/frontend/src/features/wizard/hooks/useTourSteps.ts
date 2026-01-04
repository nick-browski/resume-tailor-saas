import { useRef, useMemo } from "react";
import type { TourStep } from "@/shared/ui";

interface TourStepConfig {
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

type TourStepsConfig = Record<string, TourStepConfig>;

export function useTourSteps<T extends TourStepsConfig>(
  config: T
): {
  refs: Record<keyof T, React.RefObject<HTMLDivElement>>;
  steps: TourStep[];
} {
  // Create refs once on first render and store in useRef
  // Use useRef to store refs object so they persist between renders
  const refsRef = useRef<Record<
    string,
    React.RefObject<HTMLDivElement>
  > | null>(null);

  // Initialize refs once
  if (!refsRef.current) {
    refsRef.current = {};
    (Object.keys(config) as Array<keyof T>).forEach((key) => {
      // Create ref object with current: null (standard React ref format)
      refsRef.current![key as string] = {
        current: null,
      } as React.RefObject<HTMLDivElement>;
    });
  }

  const refs = refsRef.current as Record<
    keyof T,
    React.RefObject<HTMLDivElement>
  >;

  // Create tour steps
  const steps = useMemo(
    () =>
      (Object.keys(config) as Array<keyof T>).map((key) => ({
        target: () => refs[key].current,
        ...config[key],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(config)]
  );

  return { refs, steps };
}
