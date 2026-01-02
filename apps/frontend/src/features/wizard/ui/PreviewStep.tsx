import { useCallback, useState, useEffect } from "react";
import {
  TIMING_CONSTANTS,
  DOCUMENT_STATUS,
  ORIGINAL_PARSE_STATUS,
  UI_TEXT,
  TOAST_MESSAGES,
} from "@/shared/lib/constants";
import { useDocumentById } from "../api/useDocuments";
import { useWizardStore } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { documentsApi } from "@/shared/api";
import { Loader, LoaderOverlay } from "@/shared/ui";
import { ResumeDiff } from "./ResumeDiff";
import type { ResumeData } from "@/shared/api/types";

interface PreviewStepProps {
  onPrevious: () => void;
  onReset: () => void;
}

export function PreviewStep({ onPrevious, onReset }: PreviewStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isParsingLocal, setIsParsingLocal] = useState(false);
  const documentId = useWizardStore((state) => state.documentId);
  const parseToastId = useWizardStore((state) => state.parseToastId);
  const setParseToastId = useWizardStore((state) => state.setParseToastId);
  const { data: documentData, isLoading } = useDocumentById(documentId);

  const toast = useToastContext();

  const tailoredResumeData: ResumeData | null = documentData?.tailoredResumeData
    ? JSON.parse(documentData.tailoredResumeData)
    : null;

  const originalResumeData: ResumeData | null = documentData?.originalResumeData
    ? JSON.parse(documentData.originalResumeData)
    : null;

  const handleShowChanges = useCallback(async () => {
    setShowDiff(true);
    setIsParsingLocal(true);

    if (originalResumeData) {
      setIsParsingLocal(false);
      return;
    }

    if (documentData?.originalParseStatus === ORIGINAL_PARSE_STATUS.PARSING) {
      return;
    }

    const toastId = toast.showLoading("Parsing original resume...");
    setParseToastId(toastId);

    try {
      await documentsApi.parseOriginalResume(documentId!);
    } catch (error) {
      toast.dismissLoading(toastId);
      setParseToastId(null);
      setIsParsingLocal(false);
      toast.showError("Failed to parse original resume");
    }
  }, [
    documentId,
    documentData?.originalParseStatus,
    originalResumeData,
    toast,
    setParseToastId,
  ]);

  useEffect(() => {
    if (!parseToastId) {
      return;
    }

    if (originalResumeData) {
      toast.dismissLoading(parseToastId);
      setParseToastId(null);
      setIsParsingLocal(false);
      return;
    }

    if (
      documentData?.originalParseStatus &&
      documentData.originalParseStatus !== ORIGINAL_PARSE_STATUS.PARSING
    ) {
      toast.dismissLoading(parseToastId);
      setParseToastId(null);
      setIsParsingLocal(false);

      if (documentData.originalParseStatus === ORIGINAL_PARSE_STATUS.FAILED) {
        toast.showError("Failed to parse original resume");
      }
    }
  }, [
    parseToastId,
    originalResumeData,
    documentData?.originalParseStatus,
    toast,
    setParseToastId,
  ]);

  const isGenerating = documentData?.status === DOCUMENT_STATUS.GENERATING;
  const isParsingOriginal =
    isParsingLocal ||
    documentData?.originalParseStatus === ORIGINAL_PARSE_STATUS.PARSING;
  const isDocumentLoading = isLoading || !documentData;

  useEffect(() => {
    const isDocumentReady =
      documentData?.pdfResultPath &&
      documentData?.status === DOCUMENT_STATUS.GENERATED &&
      documentId;

    if (!isDocumentReady) {
      setPdfPreviewUrl(null);
      return;
    }

    let blobUrl: string | null = null;

    const loadPDFPreview = async () => {
      try {
        const pdfBlob = await documentsApi.downloadPDF(documentId);
        blobUrl = URL.createObjectURL(pdfBlob);
        setPdfPreviewUrl(blobUrl);
      } catch (error) {
        console.error("Error loading PDF preview:", error);
        setPdfPreviewUrl(null);
      }
    };

    loadPDFPreview();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setPdfPreviewUrl(null);
    };
  }, [documentData?.pdfResultPath, documentData?.status, documentId]);

  const handleResumeDownload = useCallback(async () => {
    if (!documentData?.pdfResultPath || !documentId) return;

    setIsDownloading(true);

    try {
      const pdfBlob = await documentsApi.downloadPDF(documentId);
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = "tailored-resume.pdf";
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
  }, [documentData?.pdfResultPath, documentId, toast]);

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

      {/* Toggle buttons */}
      {documentData?.status === DOCUMENT_STATUS.GENERATED && (
        <div className="flex gap-2 sm:gap-3 border-b pb-3 sm:pb-4">
          <button
            type="button"
            onClick={() => setShowDiff(false)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation ${
              !showDiff
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleShowChanges}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors touch-manipulation ${
              showDiff
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
          >
            Show Changes
          </button>
        </div>
      )}

      {/* Preview or Diff */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {showDiff ? "Resume Changes" : UI_TEXT.TAILORED_RESUME_PREVIEW_LABEL}
        </label>
        {showDiff && documentData?.status === DOCUMENT_STATUS.GENERATED ? (
          isParsingOriginal && !originalResumeData ? (
            <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 flex items-center justify-center min-h-[30vh] sm:min-h-[20vh] relative">
              <LoaderOverlay />
            </div>
          ) : originalResumeData && tailoredResumeData ? (
            <div className="border border-gray-300 rounded-md p-3 sm:p-4 md:p-6 bg-white overflow-x-hidden">
              <ResumeDiff
                original={originalResumeData}
                tailored={tailoredResumeData}
              />
            </div>
          ) : (
            <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50">
              <p className="text-sm text-gray-600">
                No data available for comparison
              </p>
            </div>
          )
        ) : isLoading || !documentData ? (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 flex items-center justify-center min-h-[30vh] sm:min-h-[20vh] relative">
            <LoaderOverlay message={UI_TEXT.LOADING_DOCUMENT_TEXT} />
          </div>
        ) : isGenerating ? (
          <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 flex items-center justify-center min-h-[30vh] sm:min-h-[20vh] relative">
            <LoaderOverlay message={UI_TEXT.GENERATING_TAILORED_RESUME_TEXT} />
          </div>
        ) : documentData.status === DOCUMENT_STATUS.FAILED ? (
          <div className="border border-red-300 rounded-md p-3 sm:p-4 bg-red-50">
            <p className="text-sm text-red-600">
              {UI_TEXT.GENERATION_FAILED_PREFIX}{" "}
              {documentData.error || UI_TEXT.UNKNOWN_ERROR_TEXT}
            </p>
          </div>
        ) : documentData.pdfResultPath &&
          documentData.status === DOCUMENT_STATUS.GENERATED ? (
          pdfPreviewUrl ? (
            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <div className="bg-gray-100 p-4 sm:p-6 rounded-lg shadow-sm">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                    <div className="relative bg-white">
                      <div className="h-1 bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
                      <div className="relative overflow-hidden">
                        <iframe
                          src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                          className="w-full h-[600px] sm:h-[800px] border-0"
                          title="Resume Preview"
                          style={{ display: "block" }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                      </div>
                      <div className="h-1 bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 flex items-center justify-center min-h-[30vh] sm:min-h-[20vh] relative">
              <LoaderOverlay message={UI_TEXT.LOADING_DOCUMENT_TEXT} />
            </div>
          )
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
            isDocumentLoading ||
            isDownloading ||
            isParsingOriginal ||
            !documentData?.pdfResultPath ||
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
