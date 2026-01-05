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
  usePdfFullscreen,
} from "../../../hooks";
import {
  getResumeDataFromDocument,
  getOriginalResumeDataForDiff,
} from "../../../lib/resumeDataUtils";
import { PreviewHeader } from "../preview-step/PreviewHeader";
import { PrivacyNotice } from "../preview-step/PrivacyNotice";
import { PreviewToggleButtons } from "../preview-step/PreviewToggleButtons";
import { PreviewContent } from "../preview-step/PreviewContent";
import { PreviewActions } from "../preview-step/PreviewActions";
import { Tour } from "@/shared/ui";
import { useTourSteps } from "../../../hooks/useTourSteps";
import { EDIT_PREVIEW_TOUR_KEY } from "@/shared/lib/tourUtils";

interface EditPreviewStepProps {
  onPrevious: () => void;
  onReset: () => void;
}

export function EditPreviewStep({ onPrevious, onReset }: EditPreviewStepProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [isParsingLocal, setIsParsingLocal] = useState(false);
  const documentId = useWizardStore((state) => state.documentId);
  const setParseToastId = useWizardStore((state) => state.setParseToastId);
  const { data: documentData, isLoading } = useDocumentById(documentId);
  const toast = useToastContext();

  const { currentResumeData, baselineResumeData, tailoredResumeData } =
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

  const { handleToggleFullscreen } = usePdfFullscreen(pdfPreviewUrl);

  // Create tour steps with refs
  const { refs, steps: tourSteps } = useTourSteps({
    previewButton: {
      title: "Preview Your Resume",
      content:
        "Click here to see your edited resume in preview mode. This shows the final version of your resume.",
      position: "bottom",
    },
    showChangesButton: {
      title: "Show Changes",
      content:
        "Click here to see what was modified in your resume. This highlights the differences between the original and edited versions.",
      position: "bottom",
    },
    downloadButton: {
      title: "Download Your Resume",
      content:
        "Download your edited resume as a PDF file. It's ready to use for your job application.",
      position: "top",
    },
  });

  const handleShowChanges = useCallback(async () => {
    setShowDiff(true);
    setIsParsingLocal(true);

    if (baselineResumeData && currentResumeData) {
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
    baselineResumeData,
    currentResumeData,
    toast,
    setParseToastId,
  ]);

  useEffect(() => {
    if (baselineResumeData && currentResumeData) {
      setIsParsingLocal(false);
      return;
    }

    if (
      documentData?.originalParseStatus &&
      documentData.originalParseStatus !== ORIGINAL_PARSE_STATUS.PARSING
    ) {
      setIsParsingLocal(false);
    }
  }, [
    baselineResumeData,
    currentResumeData,
    documentData?.originalParseStatus,
  ]);

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
    <>
      <Tour steps={tourSteps} storageKey={EDIT_PREVIEW_TOUR_KEY} />
      <div className="space-y-4 sm:space-y-6">
        <PreviewHeader />

        <PrivacyNotice />

        <PreviewToggleButtons
          documentStatus={documentData?.status}
          showDiff={showDiff}
          onShowPreview={() => setShowDiff(false)}
          onShowChanges={handleShowChanges}
          previewButtonRef={refs.previewButton}
          showChangesButtonRef={refs.showChangesButton}
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

        <PreviewActions
          ref={refs.downloadButton}
          isDownloading={isDownloading}
          isDocumentLoading={isDocumentLoading}
          isParsingOriginal={isParsingOriginal}
          documentData={documentData}
          onPrevious={onPrevious}
          onReset={onReset}
          onDownload={handleResumeDownload}
        />
      </div>
    </>
  );
}
