import { UI_TEXT } from "@/shared/lib/constants";

interface ValidationHintProps {
  hasAttemptedSubmit: boolean;
  validationError: string | null;
  hintText: string;
  currentLength?: number;
  maxLength?: number;
  isProcessing?: boolean;
}

export function ValidationHint({
  hasAttemptedSubmit,
  validationError,
  hintText,
  currentLength,
  maxLength,
  isProcessing = false,
}: ValidationHintProps) {
  return (
    <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
      <div className="flex-1 min-w-0 pr-2 sm:pr-0">
        {!isProcessing && hasAttemptedSubmit && validationError ? (
          <p className="text-xs sm:text-sm text-red-600 break-words leading-relaxed">
            {validationError}
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-gray-500 break-words leading-relaxed">
            {hintText}
          </p>
        )}
      </div>
      {currentLength !== undefined && maxLength !== undefined && (
        <p className="text-xs sm:text-sm text-gray-500 flex-shrink-0 sm:ml-2 whitespace-nowrap">
          <span className="sm:hidden">
            {currentLength.toLocaleString()}/{maxLength.toLocaleString()}
          </span>
          <span className="hidden sm:inline">
            {currentLength.toLocaleString()} / {maxLength.toLocaleString()}{" "}
            {UI_TEXT.CHARACTERS_LABEL}
          </span>
        </p>
      )}
    </div>
  );
}

