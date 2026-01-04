import { useEffect, useState } from "react";
import { FILE_CONSTANTS, UI_TEXT, ANIMATION_CONSTANTS } from "@/shared/lib/constants";

interface UploadedFileCardProps {
  fileName: string;
  fileSizeBytes: number;
  onReplace: (file: File) => void | Promise<void>;
  onRemove: () => void;
  disabled?: boolean;
}

export function UploadedFileCard({
  fileName,
  fileSizeBytes,
  onReplace,
  onRemove,
  disabled = false,
}: UploadedFileCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Запускаем анимацию появления после монтирования
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, ANIMATION_CONSTANTS.FILE_CARD_ENTER_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const fileSizeMB = (
    fileSizeBytes /
    (FILE_CONSTANTS.BYTES_PER_KB * FILE_CONSTANTS.BYTES_PER_KB)
  ).toFixed(FILE_CONSTANTS.FILE_SIZE_DECIMAL_PLACES);

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden transition ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
      }`}
      style={{
        transitionDuration: `${ANIMATION_CONSTANTS.FILE_CARD_ENTER_DURATION_MS}ms`,
        transitionTimingFunction: ANIMATION_CONSTANTS.FILE_CARD_EASING,
        willChange: "opacity, transform",
      }}
    >
      <div className="flex items-start gap-3 p-3 sm:p-4 border-l-4 border-green-500 bg-green-50/30">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 break-words">
            {fileName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {fileSizeMB} {UI_TEXT.FILE_SIZE_UNIT}
          </p>
        </div>
      </div>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 flex items-center gap-3 border-t border-gray-100">
        <label
          className={`text-sm font-medium transition duration-150 ${
            disabled
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-600 hover:text-blue-700 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          }`}
        >
          {UI_TEXT.REPLACE_FILE_TEXT}
          <input
            type="file"
            className="sr-only"
            accept={FILE_CONSTANTS.ACCEPTED_TYPES}
            onChange={(fileInputChangeEvent) => {
              const selectedFile = fileInputChangeEvent.target.files?.[0];
              if (selectedFile) {
                onReplace(selectedFile);
              }
            }}
            disabled={disabled}
          />
        </label>
        <span className="text-gray-300">•</span>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:scale-[1.02] active:scale-[0.98] transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
        >
          {UI_TEXT.REMOVE_FILE_TEXT}
        </button>
      </div>
    </div>
  );
}
