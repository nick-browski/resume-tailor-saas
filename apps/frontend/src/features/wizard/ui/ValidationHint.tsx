import { UI_TEXT } from "@/shared/lib/constants";

interface ValidationHintProps {
  hasAttemptedSubmit: boolean;
  validationError: string | null;
  hintText: string;
  currentLength?: number;
  maxLength?: number;
}

export function ValidationHint({
  hasAttemptedSubmit,
  validationError,
  hintText,
  currentLength,
  maxLength,
}: ValidationHintProps) {
  return (
    <div className="mt-2 flex items-center justify-between">
      <div>
        {hasAttemptedSubmit && validationError ? (
          <p className="text-sm text-red-600">{validationError}</p>
        ) : (
          <p className="text-sm text-gray-500">{hintText}</p>
        )}
      </div>
      {currentLength !== undefined && maxLength !== undefined && (
        <p className="text-sm text-gray-500">
          {currentLength.toLocaleString()} / {maxLength.toLocaleString()}{" "}
          {UI_TEXT.CHARACTERS_LABEL}
        </p>
      )}
    </div>
  );
}

