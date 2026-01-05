import { useCallback, useState, useEffect } from "react";
import {
  DOCUMENT_STATUS,
  ORIGINAL_PARSE_STATUS,
  TOAST_MESSAGES,
  UI_TEXT,
} from "@/shared/lib/constants";
import { useDocumentById } from "../../../api/useDocuments";
import { useWizardStore } from "../../../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { documentsApi, generateApi } from "@/shared/api";
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
import { FullscreenModal } from "../preview-step/FullscreenModal";
import { Loader, Tour } from "@/shared/ui";
import { useTourSteps } from "../../../hooks/useTourSteps";

interface EditPreviewStepProps {
  onPrevious: () => void;
  onReset: () => void;
}

export function EditPreviewStep({ onPrevious, onReset }: EditPreviewStepProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [isParsingLocal, setIsParsingLocal] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const documentId = useWizardStore((state) => state.documentId);
  const editPrompt = useWizardStore((state) => state.editPrompt);
  const setParseToastId = useWizardStore((state) => state.setParseToastId);
  const setEditPrompt = useWizardStore((state) => state.setEditPrompt);
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

  const { handleToggleFullscreen, shouldShowModal } = usePdfFullscreen(
    pdfPreviewUrl
  );

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

  const handleTransformResume = useCallback(async () => {
    if (!documentId) {
      toast.showError(TOAST_MESSAGES.DOCUMENT_LOAD_FAILED);
      return;
    }

    if (!editPrompt?.trim()) {
      toast.showError(UI_TEXT.EDIT_PROMPT_REQUIRED_ERROR);
      return;
    }

    setIsTransforming(true);

    try {
      await generateApi.editResume({
        documentId,
        prompt: editPrompt.trim(),
      });
      setEditPrompt(null);
    } catch (transformationError) {
      toast.showError(UI_TEXT.RESUME_EDIT_FAILED);
    } finally {
      setIsTransforming(false);
    }
  }, [documentId, editPrompt, setEditPrompt, toast]);

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
      <Tour
        steps={tourSteps}
        storageKey="resume-tailor-tour-edit-preview-step"
      />
      <div className="space-y-4 sm:space-y-6">
        <PreviewHeader />

        <PrivacyNotice />

        {!documentData?.pdfResultPath && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleTransformResume}
              disabled={isGenerating || isDocumentLoading || isTransforming}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 transition duration-150 touch-manipulation flex items-center justify-center gap-2"
            >
              {(isGenerating || isTransforming) && (
                <Loader size="sm" className="text-white" />
              )}
              {isGenerating || isTransforming
                ? UI_TEXT.EDITING_RESUME_BUTTON
                : UI_TEXT.GENERATE_TAILORED_RESUME_BUTTON}
            </button>
          </div>
        )}

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

        {shouldShowModal && pdfPreviewUrl && (
          <FullscreenModal
            pdfPreviewUrl={pdfPreviewUrl}
            onClose={handleToggleFullscreen}
          />
        )}

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
