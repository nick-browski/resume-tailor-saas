import { useState, useEffect, useCallback } from "react";
import { useMobilePdfScale } from "../../../hooks/useMobilePdfScale";
import { ANIMATION_CONSTANTS } from "@/shared/lib/constants";

interface FullscreenModalProps {
  pdfPreviewUrl: string;
  onClose: () => void;
}

// Fullscreen modal for PDF preview
export function FullscreenModal({
  pdfPreviewUrl,
  onClose,
}: FullscreenModalProps) {
  const { isMobile } = useMobilePdfScale();
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);

  useEffect(() => {
    // Trigger enter animation after mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    // Reset PDF loaded state when URL changes
    setIsPdfLoaded(false);
  }, [pdfPreviewUrl]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, ANIMATION_CONSTANTS.MODAL_EXIT_DURATION_MS);
  }, [onClose]);

  useEffect(() => {
    const handleEscapeKeyPress = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape" && !isExiting) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKeyPress);
    return () => {
      document.removeEventListener("keydown", handleEscapeKeyPress);
    };
  }, [isExiting, handleClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: isVisible ? "rgba(0, 0, 0, 0.95)" : "rgba(0, 0, 0, 0)",
        transition: `background-color ${
          isExiting
            ? ANIMATION_CONSTANTS.MODAL_EXIT_DURATION_MS
            : ANIMATION_CONSTANTS.MODAL_ENTER_DURATION_MS
        }ms ${ANIMATION_CONSTANTS.MODAL_BACKDROP_EASING}`,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExiting) {
          handleClose();
        }
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 sm:p-6 z-[60] pointer-events-none"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: `opacity ${
            isExiting
              ? ANIMATION_CONSTANTS.MODAL_EXIT_DURATION_MS
              : ANIMATION_CONSTANTS.MODAL_ENTER_DURATION_MS
          }ms ${ANIMATION_CONSTANTS.MODAL_EASING}`,
        }}
      >
        <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          <span className="hidden sm:inline">Fullscreen Mode</span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-3 sm:p-3.5 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-all touch-manipulation pointer-events-auto active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close fullscreen"
        >
          <svg
            className="w-6 h-6 sm:w-6 sm:h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.95)",
          transition: `opacity ${
            isExiting
              ? ANIMATION_CONSTANTS.MODAL_EXIT_DURATION_MS
              : ANIMATION_CONSTANTS.MODAL_ENTER_DURATION_MS
          }ms ${ANIMATION_CONSTANTS.MODAL_EASING}, transform ${
            isExiting
              ? ANIMATION_CONSTANTS.MODAL_EXIT_DURATION_MS
              : ANIMATION_CONSTANTS.MODAL_ENTER_DURATION_MS
          }ms ${ANIMATION_CONSTANTS.MODAL_EASING}`,
          willChange: "opacity, transform",
        }}
      >
        {isMobile ? (
          <object
            data={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitV`}
            type="application/pdf"
            className="w-full h-full border-0"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "100%",
              opacity: isPdfLoaded ? 1 : 0,
              transform: isPdfLoaded ? "scale(1)" : "scale(0.98)",
              transition: `opacity ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}, transform ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}`,
              willChange: "opacity, transform",
            }}
            onLoad={() => {
              setTimeout(() => {
                setIsPdfLoaded(true);
              }, ANIMATION_CONSTANTS.PDF_FADE_IN_DELAY_MS);
            }}
            aria-label="Resume Preview Fullscreen"
          >
            <p className="p-4 text-sm text-white">
              Your browser does not support PDFs.{" "}
              <a
                href={pdfPreviewUrl || ""}
                download
                className="text-blue-300 hover:underline"
              >
                Download the PDF
              </a>
              .
            </p>
          </object>
        ) : (
          <iframe
            src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width`}
            className="w-full h-full border-0"
            title="Resume Preview Fullscreen"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "100%",
              opacity: isPdfLoaded ? 1 : 0,
              transform: isPdfLoaded ? "scale(1)" : "scale(0.98)",
              transition: `opacity ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}, transform ${ANIMATION_CONSTANTS.PDF_FADE_IN_DURATION_MS}ms ${ANIMATION_CONSTANTS.PDF_FADE_IN_EASING}`,
              willChange: "opacity, transform",
            }}
            onLoad={() => {
              setTimeout(() => {
                setIsPdfLoaded(true);
              }, ANIMATION_CONSTANTS.PDF_FADE_IN_DELAY_MS);
            }}
            allow="fullscreen"
            scrolling="yes"
          />
        )}
      </div>
    </div>
  );
}
