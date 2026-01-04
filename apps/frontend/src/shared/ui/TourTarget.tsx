import { forwardRef, ReactNode } from "react";

interface TourTargetProps {
  children: ReactNode;
  className?: string;
}

export const TourTarget = forwardRef<HTMLDivElement, TourTargetProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
);

TourTarget.displayName = "TourTarget";
