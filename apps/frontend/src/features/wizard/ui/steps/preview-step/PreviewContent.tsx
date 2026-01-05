import { DOCUMENT_STATUS, UI_TEXT } from "@/shared/lib/constants";
import { DiffSkeleton, PdfSkeleton } from "@/shared/ui";
import { ResumeDiff } from "../../diff";
import { PdfPreview } from "./PdfPreview";
import type { ResumeData } from "@/shared/api/types";
import type { Document } from "@/shared/api/types";

interface PreviewContentProps {
  showDiff: boolean;
  documentData: Document | null;
  isLoading: boolean;
  isGenerating: boolean;
  isParsingOriginal: boolean;
  originalResumeData: ResumeData | null;
  tailoredResumeData: ResumeData | null;
  pdfPreviewUrl: string | null;
  onToggleFullscreen: () => void;
}

// Main content area that displays different states based on document status
export function PreviewContent({
  showDiff,
  documentData,
  isLoading,
  isGenerating,
  isParsingOriginal,
  originalResumeData,
  tailoredResumeData,
  pdfPreviewUrl,
  onToggleFullscreen,
}: PreviewContentProps) {
  // Show diff view
  if (showDiff && documentData?.status === DOCUMENT_STATUS.GENERATED) {
    if (isParsingOriginal) {
      return (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Resume Changes
            </label>
          </div>
          <DiffSkeleton />
        </div>
      );
    }

    if (originalResumeData && tailoredResumeData) {
      return (
        <div className="border border-gray-300 rounded-md p-3 sm:p-4 md:p-6 bg-white overflow-x-hidden">
          <ResumeDiff
            original={originalResumeData}
            tailored={tailoredResumeData}
          />
        </div>
      );
    }

    return (
      <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          No data available for comparison
        </p>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {showDiff
              ? "Resume Changes"
              : UI_TEXT.TAILORED_RESUME_PREVIEW_LABEL}
          </label>
        </div>
        <div className="border border-gray-300 rounded-md p-4 sm:p-6 bg-gray-50 min-h-[30vh] sm:min-h-[20vh] relative overflow-hidden">
          <PdfSkeleton />
        </div>
      </div>
    );
  }

  // Failed state
  if (documentData?.status === DOCUMENT_STATUS.FAILED) {
    return (
      <div className="border border-red-300 rounded-md p-3 sm:p-4 bg-red-50">
        <p className="text-sm text-red-600">
          {UI_TEXT.GENERATION_FAILED_PREFIX}{" "}
          {documentData.error || UI_TEXT.UNKNOWN_ERROR_TEXT}
        </p>
      </div>
    );
  }

  // PDF preview state - show PDF when document is generated
  if (
    documentData?.pdfResultPath &&
    documentData.status === DOCUMENT_STATUS.GENERATED
  ) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {showDiff
              ? "Resume Changes"
              : UI_TEXT.TAILORED_RESUME_PREVIEW_LABEL}
          </label>
          {!showDiff && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors touch-manipulation"
              aria-label="Fullscreen"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          )}
        </div>
        <PdfPreview pdfPreviewUrl={pdfPreviewUrl || ""} />
      </div>
    );
  }

  // Loading state - show skeleton instead of loader
  if (isLoading || !documentData) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {showDiff
              ? "Resume Changes"
              : UI_TEXT.TAILORED_RESUME_PREVIEW_LABEL}
          </label>
        </div>
        <PdfPreview pdfPreviewUrl="" />
      </div>
    );
  }

  // Default empty state
  return (
    <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50">
      <p className="text-sm text-gray-600">
        {UI_TEXT.NO_RESUME_AVAILABLE_TEXT}
      </p>
    </div>
  );
}
