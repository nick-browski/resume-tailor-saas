import { useState, useEffect, useCallback, useRef } from "react";
import { ANIMATION_CONSTANTS } from "@/shared/lib/constants";
import { PdfSkeleton } from "@/shared/ui";

interface FullscreenModalProps {
  pdfPreviewUrl: string;
  onClose: () => void;
}

/** Fullscreen modal for PDF preview (desktop only) */
export function FullscreenModal({
  pdfPreviewUrl,
  onClose,
}: FullscreenModalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Trigger enter animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Reset PDF loaded state when URL changes
  useEffect(() => {
    setIsPdfLoaded(false);
  }, [pdfPreviewUrl]);

  // Handle modal close with transitionend event
  useEffect(() => {
    if (!isExiting || !modalRef.current) {
      return;
    }

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (
        event.target === modalRef.current &&
        event.propertyName === "background-color"
      ) {
        onClose();
      }
    };

    const modal = modalRef.current;
    modal.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      modal.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [isExiting, onClose]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setIsVisible(false);
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (isExiting) {
      return;
    }

    const handleEscapeKeyPress = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
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
      ref={modalRef}
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
        className="absolute left-0 right-0 top-0 flex justify-between items-center z-[60] pointer-events-none p-4 sm:p-6"
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
        className="absolute inset-0 flex items-center justify-center"
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
        {!isPdfLoaded && (
          <div className="absolute inset-0 z-10">
            <PdfSkeleton />
          </div>
        )}
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
            touchAction: "pan-x pan-y pinch-zoom",
          }}
          onLoad={() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsPdfLoaded(true);
              });
            });
          }}
          allow="fullscreen"
          scrolling="yes"
        />
      </div>
    </div>
  );
}
