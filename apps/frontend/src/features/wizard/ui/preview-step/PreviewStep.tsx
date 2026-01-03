import { useCallback, useState, useEffect } from "react";
import {
  TIMING_CONSTANTS,
  DOCUMENT_STATUS,
  ORIGINAL_PARSE_STATUS,
  TOAST_MESSAGES,
} from "@/shared/lib/constants";
import { useDocumentById } from "../../api/useDocuments";
import { useWizardStore } from "../../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { documentsApi } from "@/shared/api";
import { PreviewHeader } from "./PreviewHeader";
import { PreviewToggleButtons } from "./PreviewToggleButtons";
import { PreviewContent } from "./PreviewContent";
import { PreviewActions } from "./PreviewActions";
import { FullscreenModal } from "./FullscreenModal";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Load PDF preview when document is ready
  useEffect(() => {
    const isDocumentReady =
      documentData?.pdfResultPath &&
      documentData?.status === DOCUMENT_STATUS.GENERATED &&
      documentId;

    if (!isDocumentReady) {
      setPdfPreviewUrl(null);
      return;
    }

    let isCancelled = false;

    const loadPDFPreview = async () => {
      try {
        const pdfBlob = await documentsApi.downloadPDF(documentId);
        if (isCancelled) {
          URL.revokeObjectURL(URL.createObjectURL(pdfBlob));
          return;
        }
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfPreviewUrl(blobUrl);
      } catch (error) {
        console.error("Error loading PDF preview:", error);
        if (!isCancelled) {
          setPdfPreviewUrl(null);
        }
      }
    };

    loadPDFPreview();

    return () => {
      isCancelled = true;
      setPdfPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
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

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Handle escape key and body scroll lock in fullscreen mode
  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = "";
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PreviewHeader />

      <PreviewToggleButtons
        documentStatus={documentData?.status}
        showDiff={showDiff}
        onShowPreview={() => setShowDiff(false)}
        onShowChanges={handleShowChanges}
      />

      <PreviewContent
        showDiff={showDiff}
        documentData={documentData}
        isLoading={isLoading}
        isGenerating={isGenerating}
        isParsingOriginal={isParsingOriginal}
        originalResumeData={originalResumeData}
        tailoredResumeData={tailoredResumeData}
        pdfPreviewUrl={pdfPreviewUrl}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {isFullscreen && pdfPreviewUrl && (
        <FullscreenModal
          pdfPreviewUrl={pdfPreviewUrl}
          onClose={handleToggleFullscreen}
        />
      )}

      <PreviewActions
        isDownloading={isDownloading}
        isDocumentLoading={isDocumentLoading}
        isParsingOriginal={isParsingOriginal}
        documentData={documentData}
        onPrevious={onPrevious}
        onReset={onReset}
        onDownload={handleResumeDownload}
      />
    </div>
  );
}

