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

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pr-24 sm:pr-28 ${className}`}
        {...restProps}
      />
      {showClearButton && (
        <button
          type="button"
          onClick={onClear}
          className="absolute bottom-2 right-2 text-[13px] leading-none text-gray-400 hover:text-gray-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
          aria-label="Clear text"
        >
          Clear
        </button>
      )}
    </div>
  );
}


