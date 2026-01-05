import { useState, useEffect } from "react";
import { DOM_CONSTANTS } from "@/shared/lib/constants";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    setIsFullscreen((previousFullscreenState) => !previousFullscreenState);
  };

  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = DOM_CONSTANTS.OVERFLOW_AUTO;
      return;
    }

    document.body.style.overflow = DOM_CONSTANTS.OVERFLOW_HIDDEN;

    return () => {
      document.body.style.overflow = DOM_CONSTANTS.OVERFLOW_AUTO;
    };
  }, [isFullscreen]);

  return { isFullscreen, handleToggleFullscreen };
}
