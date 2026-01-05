import { useCallback } from "react";
import { useFullscreen } from "./useFullscreen";
import { useMobilePdfScale } from "./useMobilePdfScale";

/** Hook for handling PDF fullscreen (opens in new tab on mobile) */
export function usePdfFullscreen(pdfPreviewUrl: string | null) {
  const { isFullscreen, handleToggleFullscreen: baseHandleToggleFullscreen } =
    useFullscreen();
  const { isMobile } = useMobilePdfScale();

  const handleToggleFullscreen = useCallback(() => {
    if (isMobile && pdfPreviewUrl) {
      // Open PDF in new tab for mobile devices
      window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer");
      return;
    }
    baseHandleToggleFullscreen();
  }, [isMobile, pdfPreviewUrl, baseHandleToggleFullscreen]);

  return {
    isFullscreen,
    handleToggleFullscreen,
    shouldShowModal: isFullscreen && pdfPreviewUrl && !isMobile,
  };
}
