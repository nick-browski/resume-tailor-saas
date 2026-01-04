import { DOCUMENT_STATUS } from "@/shared/lib/constants";
import { TourTarget } from "@/shared/ui";
import type { Document } from "@/shared/api/types";

interface PreviewToggleButtonsProps {
  documentStatus: Document["status"] | undefined;
  showDiff: boolean;
  onShowPreview: () => void;
  onShowChanges: () => void;
  previewButtonRef?: React.RefObject<HTMLDivElement>;
  showChangesButtonRef?: React.RefObject<HTMLDivElement>;
}

// Toggle buttons for switching between preview and diff views
// Always render buttons immediately, disable if document is not ready
export function PreviewToggleButtons({
  documentStatus,
  showDiff,
  onShowPreview,
  onShowChanges,
  previewButtonRef,
  showChangesButtonRef,
}: PreviewToggleButtonsProps) {
  const isDocumentReady = documentStatus === DOCUMENT_STATUS.GENERATED;
  const isDisabled = !isDocumentReady;

  return (
    <div className="flex gap-2 sm:gap-3 border-b pb-3 sm:pb-4">
      <TourTarget ref={previewButtonRef}>
        <button
          type="button"
          onClick={onShowPreview}
          disabled={isDisabled}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation ${
            isDisabled
              ? "bg-blue-600 text-white opacity-50 cursor-not-allowed"
              : !showDiff
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 active:bg-gray-200"
          }`}
        >
          Preview
        </button>
      </TourTarget>
      <TourTarget ref={showChangesButtonRef}>
        <button
          type="button"
          onClick={onShowChanges}
          disabled={isDisabled}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation ${
            isDisabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : showDiff
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 active:bg-gray-200"
          }`}
        >
          Show Changes
        </button>
      </TourTarget>
    </div>
  );
}
