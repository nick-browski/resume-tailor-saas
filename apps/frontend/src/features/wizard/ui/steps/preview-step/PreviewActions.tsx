import { forwardRef } from "react";
import { DOCUMENT_STATUS, UI_TEXT } from "@/shared/lib/constants";
import { Loader, TourTarget } from "@/shared/ui";
import type { Document } from "@/shared/api/types";

interface PreviewActionsProps {
  isDownloading: boolean;
  isDocumentLoading: boolean;
  isParsingOriginal: boolean;
  documentData: Document | null;
  onPrevious: () => void;
  onReset: () => void;
  onDownload: () => void;
}

// Action buttons for navigation and download
export const PreviewActions = forwardRef<HTMLDivElement, PreviewActionsProps>(
  function PreviewActions(
    {
      isDownloading,
      isDocumentLoading,
      isParsingOriginal,
      documentData,
      onPrevious,
      onReset,
      onDownload,
    },
    ref
  ) {
    const isDownloadDisabled =
      isDocumentLoading ||
      isDownloading ||
      isParsingOriginal ||
      !documentData?.pdfResultPath ||
      documentData?.status !== DOCUMENT_STATUS.GENERATED;

    return (
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onPrevious}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            {UI_TEXT.BACK_BUTTON}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            {UI_TEXT.START_OVER_BUTTON}
          </button>
        </div>
        <TourTarget ref={ref}>
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloadDisabled}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation flex items-center justify-center gap-2"
          >
            {isDownloading && <Loader size="sm" />}
            {isDownloading
              ? UI_TEXT.DOWNLOADING_TEXT
              : UI_TEXT.DOWNLOAD_RESUME_BUTTON}
          </button>
        </TourTarget>
      </div>
    );
  }
);
