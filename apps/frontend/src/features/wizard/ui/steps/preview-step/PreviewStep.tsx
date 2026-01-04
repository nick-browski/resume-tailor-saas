import { useCallback, useState, useEffect } from "react";
import {
  DOCUMENT_STATUS,
  ORIGINAL_PARSE_STATUS,
  TOAST_MESSAGES,
} from "@/shared/lib/constants";
import { useDocumentById } from "../../../api/useDocuments";
import { useWizardStore } from "../../../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { documentsApi } from "@/shared/api";
import {
  usePdfPreview,
  useResumeDownload,
  useFullscreen,
} from "../../../hooks";
import {
  getResumeDataFromDocument,
  getOriginalResumeDataForDiff,
} from "../../../lib/resumeDataUtils";
import { PreviewHeader } from "./PreviewHeader";
import { PreviewToggleButtons } from "./PreviewToggleButtons";
import { PreviewContent } from "./PreviewContent";
import { PreviewActions } from "./PreviewActions";
import { FullscreenModal } from "./FullscreenModal";

interface PreviewStepProps {
  onPrevious: () => void;
  onReset: () => void;
}

export function PreviewStep({ onPrevious, onReset }: PreviewStepProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [isParsingLocal, setIsParsingLocal] = useState(false);
  const documentId = useWizardStore((state) => state.documentId);
  const setParseToastId = useWizardStore((state) => state.setParseToastId);
  const { data: documentData, isLoading } = useDocumentById(documentId);
  const toast = useToastContext();

  const { tailoredResumeData, currentResumeData, baselineResumeData } =
    getResumeDataFromDocument(documentData);

  const { pdfPreviewUrl } = usePdfPreview({
    documentId,
    pdfResultPath: documentData?.pdfResultPath || null,
    documentStatus: documentData?.status,
  });

  const { isDownloading, handleResumeDownload } = useResumeDownload({
    documentId,
    pdfResultPath: documentData?.pdfResultPath || null,
  });

  const { isFullscreen, handleToggleFullscreen } = useFullscreen();

  // Handles showing changes by triggering original resume parsing
  // Toast notifications are managed by useDocumentStatusMonitor
  const handleShowChanges = useCallback(async () => {
    setShowDiff(true);
    setIsParsingLocal(true);

    if (currentResumeData) {
      setIsParsingLocal(false);
      return;
    }

    if (documentData?.originalParseStatus === ORIGINAL_PARSE_STATUS.PARSING) {
      return;
    }

    const toastId = toast.showLoading(TOAST_MESSAGES.PARSING_ORIGINAL_RESUME);
    setParseToastId(toastId);

    try {
      await documentsApi.parseOriginalResume(documentId!);
    } catch (parsingError) {
      toast.dismissLoading(toastId);
      setParseToastId(null);
      setIsParsingLocal(false);
      toast.showError(TOAST_MESSAGES.PARSE_ORIGINAL_RESUME_FAILED);
    }
  }, [
    documentId,
    documentData?.originalParseStatus,
    currentResumeData,
    toast,
    setParseToastId,
  ]);

  // Update local state; toast notifications handled by useDocumentStatusMonitor
  useEffect(() => {
    if (currentResumeData) {
      setIsParsingLocal(false);
      return;
    }

    if (
      documentData?.originalParseStatus &&
      documentData.originalParseStatus !== ORIGINAL_PARSE_STATUS.PARSING
    ) {
      setIsParsingLocal(false);
    }
  }, [currentResumeData, documentData?.originalParseStatus]);

  const isGenerating = documentData?.status === DOCUMENT_STATUS.GENERATING;
  const isParsingOriginal =
    isParsingLocal ||
    documentData?.originalParseStatus === ORIGINAL_PARSE_STATUS.PARSING;
  const isDocumentLoading = isLoading || !documentData;

  const originalResumeDataForDiff = getOriginalResumeDataForDiff(
    showDiff,
    baselineResumeData,
    currentResumeData
  );

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
        originalResumeData={originalResumeDataForDiff}
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
