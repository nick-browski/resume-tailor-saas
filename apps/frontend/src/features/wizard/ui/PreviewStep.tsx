import { useCallback, useState } from "react";
import {
  FILE_CONSTANTS,
  TIMING_CONSTANTS,
  DOCUMENT_STATUS,
  UI_TEXT,
  TOAST_MESSAGES,
} from "@/shared/lib/constants";
import { useDocumentById } from "../api/useDocuments";
import { useWizardStore } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { Loader, LoaderOverlay } from "@/shared/ui";

interface PreviewStepProps {
  onPrevious: () => void;
  onReset: () => void;
}

export function PreviewStep({ onPrevious, onReset }: PreviewStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const documentId = useWizardStore((state) => state.documentId);

  // Poll documentId to track status and get resume
  const { data: documentData, isLoading } = useDocumentById(documentId);

  const toast = useToastContext();

  const handleResumeDownload = useCallback(async () => {
    if (!documentData?.tailoredText) return;

    setIsDownloading(true);

    try {
      const resumeBlob = new Blob([documentData.tailoredText], {
        type: FILE_CONSTANTS.MARKDOWN_MIME_TYPE,
      });
      const downloadUrl = URL.createObjectURL(resumeBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = FILE_CONSTANTS.DEFAULT_FILENAME;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);

      toast.showSuccess(TOAST_MESSAGES.RESUME_DOWNLOADED_SUCCESS);
    } catch (error) {
      toast.showError(TOAST_MESSAGES.RESUME_DOWNLOAD_FAILED);
      console.error("Download error:", error);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
      }, TIMING_CONSTANTS.DOWNLOAD_DELAY_MS);
    }
  }, [documentData, toast]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          {UI_TEXT.PREVIEW_STEP_TITLE}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {UI_TEXT.PREVIEW_STEP_DESCRIPTION}
        </p>
      </div>

      {/* Preview */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {UI_TEXT.TAILORED_RESUME_PREVIEW_LABEL}
        </label>
        {isLoading || !documentData ? (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 flex items-center justify-center min-h-[30vh] sm:min-h-[20vh] relative">
            <LoaderOverlay message={UI_TEXT.LOADING_DOCUMENT_TEXT} />
            <p className="text-sm text-gray-600">{UI_TEXT.LOADING_TEXT}</p>
          </div>
        ) : documentData.status === DOCUMENT_STATUS.GENERATING ||
          documentData.status === DOCUMENT_STATUS.PARSED ? (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 flex items-center justify-center min-h-[30vh] sm:min-h-[20vh] relative">
            <LoaderOverlay message={UI_TEXT.GENERATING_TAILORED_RESUME_TEXT} />
            <p className="text-sm text-gray-600">
              {UI_TEXT.GENERATING_TAILORED_RESUME_TEXT}
            </p>
          </div>
        ) : documentData.status === DOCUMENT_STATUS.FAILED ? (
          <div className="border border-red-300 rounded-md p-3 sm:p-4 bg-red-50">
            <p className="text-sm text-red-600">
              {UI_TEXT.GENERATION_FAILED_PREFIX}{" "}
              {documentData.error || UI_TEXT.UNKNOWN_ERROR_TEXT}
            </p>
          </div>
        ) : documentData.tailoredText ? (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-gray-800">
              {documentData.tailoredText}
            </pre>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              {UI_TEXT.NO_RESUME_AVAILABLE_TEXT}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onPrevious}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            {UI_TEXT.BACK_BUTTON}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            {UI_TEXT.START_OVER_BUTTON}
          </button>
        </div>
        <button
          type="button"
          onClick={handleResumeDownload}
          disabled={
            isDownloading ||
            !documentData?.tailoredText ||
            documentData?.status !== DOCUMENT_STATUS.GENERATED
          }
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation flex items-center justify-center gap-2"
        >
          {isDownloading && <Loader size="sm" />}
          {isDownloading
            ? UI_TEXT.DOWNLOADING_TEXT
            : UI_TEXT.DOWNLOAD_RESUME_BUTTON}
        </button>
      </div>
    </div>
  );
}
