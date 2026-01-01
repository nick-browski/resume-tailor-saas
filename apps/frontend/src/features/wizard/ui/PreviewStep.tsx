import { useCallback, useState, useEffect } from "react";
import { FILE_CONSTANTS, TIMING_CONSTANTS } from "@/shared/lib/constants";
import { useDocumentById } from "../api/useDocuments";
import { useWizardStore } from "../model/wizardStore";

interface PreviewStepProps {
  onPrevious: () => void;
  onReset: () => void;
}

export function PreviewStep({ onPrevious, onReset }: PreviewStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const documentId = useWizardStore((state) => state.documentId);
  const { data: documentData, isLoading, refetch } = useDocumentById(documentId);

  // Poll for document updates while generating
  useEffect(() => {
    if (!documentId || !documentData) return;

    if (documentData.status === "generating") {
      const interval = setInterval(() => {
        refetch();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [documentId, documentData?.status, refetch]);

  const handleResumeDownload = useCallback(async () => {
    if (!documentData?.tailoredText) return;

    setIsDownloading(true);

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

    setTimeout(() => {
      setIsDownloading(false);
    }, TIMING_CONSTANTS.DOWNLOAD_DELAY_MS);
  }, [documentData]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          Step 3: Preview & Download
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Review your tailored resume and download it when ready.
        </p>
      </div>

      {/* Preview */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Tailored Resume Preview
        </label>
        {isLoading ? (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        ) : documentData?.status === "generating" ? (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-gray-600">Generating tailored resume... Please wait.</p>
          </div>
        ) : documentData?.status === "failed" ? (
          <div className="border border-red-300 rounded-md p-3 sm:p-4 bg-red-50">
            <p className="text-sm text-red-600">
              Generation failed: {documentData.error || "Unknown error"}
            </p>
          </div>
        ) : documentData?.tailoredText ? (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 max-h-80 sm:max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-gray-800">
              {documentData.tailoredText}
            </pre>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50">
            <p className="text-sm text-gray-600">No resume available yet.</p>
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
            Back
          </button>
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            Start Over
          </button>
        </div>
        <button
          type="button"
          onClick={handleResumeDownload}
          disabled={isDownloading || !documentData?.tailoredText || documentData?.status !== "generated"}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {isDownloading ? "Downloading..." : "Download Resume"}
        </button>
      </div>
    </div>
  );
}
