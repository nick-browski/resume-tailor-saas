import { UI_TEXT } from "@/shared/lib/constants";

// Displays the preview step header with title and description
export function PreviewHeader() {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
        {UI_TEXT.PREVIEW_STEP_TITLE}
      </h2>
      <p className="text-sm sm:text-base text-gray-600">
        {UI_TEXT.PREVIEW_STEP_DESCRIPTION}
      </p>
    </div>
  );
}

