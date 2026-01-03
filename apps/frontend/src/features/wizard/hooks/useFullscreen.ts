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

    const handleEscapeKeyPress = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === DOM_CONSTANTS.ESCAPE_KEY) {
        setIsFullscreen(false);
      }
    };

    document.body.style.overflow = DOM_CONSTANTS.OVERFLOW_HIDDEN;
    document.addEventListener(
      DOM_CONSTANTS.KEYDOWN_EVENT,
      handleEscapeKeyPress
    );

    return () => {
      document.removeEventListener(
        DOM_CONSTANTS.KEYDOWN_EVENT,
        handleEscapeKeyPress
      );
      document.body.style.overflow = DOM_CONSTANTS.OVERFLOW_AUTO;
    };
  }, [isFullscreen]);

  return { isFullscreen, handleToggleFullscreen };
}
