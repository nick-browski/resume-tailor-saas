import { useMobilePdfScale } from "../../../hooks/useMobilePdfScale";
import { useState, useEffect } from "react";
import { PdfSkeleton } from "@/shared/ui";
import { ANIMATION_CONSTANTS } from "@/shared/lib/constants";

interface PdfPreviewProps {
  pdfPreviewUrl: string;
}

// Displays PDF preview with mobile and desktop optimizations
export function PdfPreview({ pdfPreviewUrl }: PdfPreviewProps) {
  const { isMobile, mobileScale } = useMobilePdfScale();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const containerHeight = isMobile ? "50vh" : "60vh";

  useEffect(() => {
    if (pdfPreviewUrl) {
      setIsLoading(true);
      setHasError(false);
      setIsVisible(false);
    }
  }, [pdfPreviewUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    // Use requestAnimationFrame for smooth animation trigger
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Show skeleton if PDF URL is not available
  if (!pdfPreviewUrl) {
    return (
      <div className="flex justify-center -mx-4 sm:mx-0">
        <div className="w-full max-w-4xl">
          <div className="bg-gray-100 p-2 sm:p-4 md:p-6 rounded-lg shadow-sm">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="relative bg-white">
                <div className="h-1 bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
                <div
                  className="relative overflow-auto"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    height: containerHeight,
                    minHeight: "400px",
                  }}
                >
                  <PdfSkeleton />
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center -mx-4 sm:mx-0">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-100 p-2 sm:p-4 md:p-6 rounded-lg shadow-sm">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="relative bg-white">
              <div className="h-1 bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
              <div
                className="relative"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  height: containerHeight,
                  minHeight: "400px",
                  overflow: isMobile ? "hidden" : "auto",
                }}
              >
                {/* Skeleton shown while loading */}
                {isLoading && (
                  <div className="absolute inset-0 z-10">
                    <PdfSkeleton />
                  </div>
                )}

                {isMobile ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        transform: `scale(${mobileScale})`,
                        transformOrigin: "top left",
                        width: `${100 / mobileScale}%`,
                        height: `${100 / mobileScale}%`,
                      }}
                    >
                      <iframe
                        src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitV`}
                        className="border-0"
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          minHeight: "400px",
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? "scale(1)" : "scale(0.98)",
                          transition: `opacity ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}, transform ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}`,
                          willChange: "opacity, transform",
                          WebkitOverflowScrolling: "touch",
                        }}
                        onLoad={handleLoad}
                        onError={handleError}
                        title="Resume Preview"
                        allow="fullscreen"
                        scrolling="yes"
                      />
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width`}
                    className="w-full h-full border-0"
                    title="Resume Preview"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      WebkitOverflowScrolling: "touch",
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "scale(1)" : "scale(0.98)",
                      transition: `opacity ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}, transform ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}`,
                      willChange: "opacity, transform",
                    }}
                    onLoad={handleLoad}
                    onError={handleError}
                    allow="fullscreen"
                    scrolling="yes"
                  />
                )}

                {/* Error state */}
                {hasError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Failed to load PDF preview
                    </p>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
