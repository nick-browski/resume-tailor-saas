import { useCallback } from "react";

/** Hook for handling PDF fullscreen (always opens in new tab) */
export function usePdfFullscreen(pdfPreviewUrl: string | null) {
  const handleToggleFullscreen = useCallback(() => {
    if (pdfPreviewUrl) {
      // Always open PDF in new tab (both mobile and desktop)
      window.open(pdfPreviewUrl, "_blank", "noopener,noreferrer");
    }
  }, [pdfPreviewUrl]);

  return {
    handleToggleFullscreen,
  };
}
