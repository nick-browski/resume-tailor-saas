import { useMobilePdfScale } from "../../../hooks/useMobilePdfScale";
import { useState, useEffect } from "react";
import { PdfSkeleton } from "@/shared/ui";
import { ANIMATION_CONSTANTS } from "@/shared/lib/constants";

// Container dimensions constants
const CONTAINER_HEIGHT_MOBILE = "50vh";
const CONTAINER_HEIGHT_DESKTOP = "60vh";
const MIN_CONTAINER_HEIGHT_PX = "400px";

// PDF viewer configuration constants
const PDF_VIEWER_PARAMS_MOBILE = "#toolbar=0&navpanes=0&scrollbar=1&view=FitV";
const PDF_VIEWER_PARAMS_DESKTOP =
  "#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width";

// Animation constants
const TRANSFORM_ORIGIN_TOP_LEFT = "top left";

// CSS dimension constants
const FULL_WIDTH_PERCENT = "100%";
const FULL_HEIGHT_PERCENT = "100%";

interface PdfPreviewProps {
  pdfPreviewUrl: string;
}

// Displays PDF preview with mobile and desktop optimizations
export function PdfPreview({ pdfPreviewUrl }: PdfPreviewProps) {
  const { isMobile, mobileScale } = useMobilePdfScale();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Fixed height for container to prevent layout shift
  const containerHeight = isMobile
    ? CONTAINER_HEIGHT_MOBILE
    : CONTAINER_HEIGHT_DESKTOP;
  const minHeight = MIN_CONTAINER_HEIGHT_PX;

  useEffect(() => {
    if (pdfPreviewUrl) {
      setIsLoading(true);
      setHasError(false);
      setIsVisible(false);
    }
  }, [pdfPreviewUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    // Trigger fade-in animation after a short delay
    setTimeout(() => {
      setIsVisible(true);
    }, ANIMATION_CONSTANTS.PDF_FADE_IN_DELAY_MS);
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
                    width: FULL_WIDTH_PERCENT,
                    maxWidth: FULL_WIDTH_PERCENT,
                    height: containerHeight,
                    minHeight: minHeight,
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
                  width: FULL_WIDTH_PERCENT,
                  maxWidth: FULL_WIDTH_PERCENT,
                  height: containerHeight,
                  minHeight: minHeight,
                  overflow: isMobile ? "hidden" : "auto",
                }}
              >
                {/* Skeleton shown while loading */}
                {isLoading && (
                  <div className="absolute inset-0 z-10">
                    <PdfSkeleton />
                  </div>
                )}

                {/* PDF content */}
                {isMobile ? (
                  <div
                    style={{
                      width: FULL_WIDTH_PERCENT,
                      height: FULL_HEIGHT_PERCENT,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        transform: `scale(${mobileScale})`,
                        transformOrigin: TRANSFORM_ORIGIN_TOP_LEFT,
                        width: `${100 / mobileScale}%`,
                        height: `${100 / mobileScale}%`,
                      }}
                    >
                      <object
                        data={`${pdfPreviewUrl}${PDF_VIEWER_PARAMS_MOBILE}`}
                        type="application/pdf"
                        className="border-0"
                        style={{
                          display: "block",
                          width: FULL_WIDTH_PERCENT,
                          height: FULL_HEIGHT_PERCENT,
                          minHeight: MIN_CONTAINER_HEIGHT_PX,
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? "scale(1)" : "scale(0.98)",
                          transition: `opacity ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}, transform ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}`,
                          willChange: "opacity, transform",
                        }}
                        onLoad={handleLoad}
                        onError={handleError}
                        aria-label="Resume Preview"
                      >
                        <p className="p-4 text-sm text-gray-600">
                          Your browser does not support PDFs.{" "}
                          <a
                            href={pdfPreviewUrl || ""}
                            download
                            className="text-blue-600 hover:underline"
                          >
                            Download the PDF
                          </a>
                          .
                        </p>
                      </object>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`${pdfPreviewUrl}${PDF_VIEWER_PARAMS_DESKTOP}`}
                    className="w-full h-full border-0"
                    title="Resume Preview"
                    style={{
                      display: "block",
                      width: FULL_WIDTH_PERCENT,
                      height: FULL_HEIGHT_PERCENT,
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
