import { DOCUMENT_STATUS } from "@/shared/lib/constants";
import type { Document } from "@/shared/api/types";

interface PreviewToggleButtonsProps {
  documentStatus: Document["status"] | undefined;
  showDiff: boolean;
  onShowPreview: () => void;
  onShowChanges: () => void;
}

// Toggle buttons for switching between preview and diff views
export function PreviewToggleButtons({
  documentStatus,
  showDiff,
  onShowPreview,
  onShowChanges,
}: PreviewToggleButtonsProps) {
  if (documentStatus !== DOCUMENT_STATUS.GENERATED) {
    return null;
  }

  return (
    <div className="flex gap-2 sm:gap-3 border-b pb-3 sm:pb-4">
      <button
        type="button"
        onClick={onShowPreview}
        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation ${
          !showDiff
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 active:bg-gray-200"
        }`}
      >
        Preview
      </button>
      <button
        type="button"
        onClick={onShowChanges}
        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation ${
          showDiff
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 active:bg-gray-200"
        }`}
      >
        Show Changes
      </button>
    </div>
  );
}

