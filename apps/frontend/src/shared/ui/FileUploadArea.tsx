import { useCallback } from "react";
import { FILE_CONSTANTS, UI_TEXT } from "@/shared/lib/constants";

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  hasError?: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUploadArea({
  onFileSelect,
  disabled = false,
  hasError = false,
  accept = FILE_CONSTANTS.ACCEPTED_TYPES,
  maxSizeMB = FILE_CONSTANTS.MAX_SIZE_MB,
}: FileUploadAreaProps) {
  const handleFileInputChange = useCallback(
    (fileInputChangeEvent: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = fileInputChangeEvent.target.files?.[0];
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback(
    (dragOverEvent: React.DragEvent<HTMLDivElement>) => {
      dragOverEvent.preventDefault();
      dragOverEvent.stopPropagation();
    },
    []
  );

  const handleDrop = useCallback(
    (dropEvent: React.DragEvent<HTMLDivElement>) => {
      dropEvent.preventDefault();
      dropEvent.stopPropagation();

      if (disabled) return;

      const droppedFile = dropEvent.dataTransfer.files?.[0];
      if (droppedFile) {
        onFileSelect(droppedFile);
      }
    },
    [disabled, onFileSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`mt-1 flex justify-center px-4 sm:px-6 pt-6 sm:pt-10 pb-6 sm:pb-10 border-2 border-dashed rounded-lg transition-colors ${
        disabled
          ? "border-gray-200 bg-gray-50 cursor-not-allowed pointer-events-none"
          : hasError
          ? "border-red-300 bg-red-50 hover:border-red-400"
          : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
      }`}
    >
      <div className="space-y-3 sm:space-y-4 text-center w-full max-w-md">
        <svg
          className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 transition-colors ${
            hasError ? "text-red-400" : "text-gray-400"
          }`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="space-y-2 sm:space-y-1">
          <label className="relative inline-block w-full sm:w-auto">
            <span className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 sm:px-4 sm:py-2 text-sm font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-md cursor-pointer hover:bg-blue-50 hover:scale-[1.02] active:bg-blue-100 active:scale-[0.98] transition duration-150 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100">
              {UI_TEXT.UPLOAD_FILE_TEXT}
            </span>
            <input
              type="file"
              className="sr-only"
              accept={accept}
              onChange={handleFileInputChange}
              disabled={disabled}
            />
          </label>
          <p className="text-xs sm:text-sm text-gray-500 px-2">
            {UI_TEXT.DRAG_AND_DROP_TEXT}
          </p>
        </div>
        <p className="text-xs text-gray-400 px-2">
          {UI_TEXT.PDF_SIZE_LIMIT_TEXT} {maxSizeMB} {UI_TEXT.FILE_SIZE_UNIT}
        </p>
      </div>
    </div>
  );
}


