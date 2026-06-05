import React from "react";

interface ClearableTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClear: () => void;
}

export function ClearableTextarea({
  value,
  onChange,
  onClear,
  className = "",
  disabled,
  ...restProps
}: ClearableTextareaProps) {
  const showClearButton = !!value && !disabled;

  // Shared input surface so every textarea reads as a recessed dark "well"
  // (gray-900 under gray-800 cards) instead of a glaring white box.
  const surfaceClassName =
    "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800";

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pr-24 sm:pr-28 ${surfaceClassName} ${className}`}
        {...restProps}
      />
      {showClearButton && (
        <button
          type="button"
          onClick={onClear}
          className="absolute bottom-2 right-2 text-[13px] leading-none text-gray-400 dark:text-gray-400 hover:text-gray-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
          aria-label="Clear text"
        >
          Clear
        </button>
      )}
    </div>
  );
}


