import { useMobilePdfScale } from "../../hooks/useMobilePdfScale";

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

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 sm:p-6 z-10 pointer-events-none">
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
          onClick={onClose}
          className="p-2.5 sm:p-3 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-all touch-manipulation pointer-events-auto active:scale-95"
          aria-label="Close fullscreen"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
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
      <div className="w-full h-full flex items-center justify-center pt-16 sm:pt-20">
        {isMobile ? (
          <object
            data={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitV`}
            type="application/pdf"
            className="w-full h-full border-0"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "100%",
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
            }}
            allow="fullscreen"
            scrolling="yes"
          />
        )}
      </div>
    </div>
  );
}

