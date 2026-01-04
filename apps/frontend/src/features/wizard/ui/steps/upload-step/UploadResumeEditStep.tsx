import { useState } from "react";
import { UI_TEXT, DOCUMENT_STATUS } from "@/shared/lib/constants";
import { useWizardStore } from "../../../model/wizardStore";
import { useDocumentById } from "../../../api/useDocuments";
import { Loader, Tour, TourTarget } from "@/shared/ui";
import { useEditAndTransform } from "../../../hooks";
import { useClassifyContent } from "../../../api/useClassification";
import { ResumeUploadSection, EditPromptSection } from "../../sections";
import { ValidationWarning } from "../../validation";
import { useTourSteps } from "../../../hooks/useTourSteps";

interface UploadResumeEditStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function UploadResumeEditStep({
  onNext,
  onPrevious,
}: UploadResumeEditStepProps) {
  const resumeData = useWizardStore((state) => state.resumeData);
  const uploadMode = useWizardStore((state) => state.uploadMode);
  const documentId = useWizardStore((state) => state.documentId);
  const generationToastId = useWizardStore((state) => state.generationToastId);
  const { data: currentDocument } = useDocumentById(documentId);
  const { classificationErrors, classifyContent } = useClassifyContent();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editPromptError, setEditPromptError] = useState<string | null>(null);

  // Create tour steps with refs
  const { refs, steps: tourSteps } = useTourSteps({
    uploadArea: {
      title: "Upload Your Resume",
      content:
        "Upload your PDF resume or paste the text here. This is the resume you want to edit.",
      position: "top",
    },
    editPromptTextarea: {
      title: "Enter Edit Instructions",
      content:
        "Describe what changes you want to make to your resume. You can use templates or write your own instructions.",
      position: "top",
    },
    generateButton: {
      title: "Generate Edited Resume",
      content:
        "Click here to generate your edited resume based on your instructions.",
      position: "top",
    },
  });

  // Generation in progress: toast visible, document processing, or local editing
  const isGenerationInProgress =
    isEditing ||
    !!generationToastId ||
    (documentId !== null &&
      currentDocument?.status !== undefined &&
      currentDocument.status !== DOCUMENT_STATUS.GENERATED &&
      currentDocument.status !== DOCUMENT_STATUS.FAILED);

  const { handleEditAndTransform: handleEditAndTransformInternal } =
    useEditAndTransform({
      uploadMode,
      resumeData,
      documentId,
      editPrompt,
      classifyContent,
      onValidationError: setValidationError,
      onEditPromptError: setEditPromptError,
      onNext,
    });

  const handleEditAndTransform = async () => {
    setHasAttemptedSubmit(true);
    setIsEditing(true);
    const success = await handleEditAndTransformInternal();
    if (success) {
      setEditPrompt("");
    }
    setIsEditing(false);
  };

  const isResumeValid =
    !validationError && (resumeData?.file || resumeData?.text?.trim());

  return (
    <>
      <Tour
        steps={tourSteps}
        storageKey="resume-tailor-tour-upload-edit-step"
      />
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
            {UI_TEXT.UPLOAD_RESUME_STEP_TITLE}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {UI_TEXT.UPLOAD_RESUME_EDIT_STEP_DESCRIPTION}
          </p>
        </div>

        <ResumeUploadSection
          ref={refs.uploadArea}
          isGenerationInProgress={isGenerationInProgress}
          hasAttemptedSubmit={hasAttemptedSubmit}
          validationError={validationError}
          onValidationError={setValidationError}
        />

        {classificationErrors.resumeError && (
          <ValidationWarning
            title={UI_TEXT.INVALID_RESUME_TITLE}
            message={classificationErrors.resumeError}
          />
        )}

        <EditPromptSection
          ref={refs.editPromptTextarea}
          editPrompt={editPrompt}
          editPromptError={editPromptError}
          isEditing={isEditing}
          hasAttemptedSubmit={hasAttemptedSubmit}
          onEditPromptChange={setEditPrompt}
          onEditPromptError={setEditPromptError}
        />

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onPrevious}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-white text-gray-700 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            {UI_TEXT.BACK_BUTTON}
          </button>
          <TourTarget ref={refs.generateButton}>
            <button
              type="button"
              onClick={handleEditAndTransform}
              disabled={
                !isResumeValid ||
                isEditing ||
                !editPrompt ||
                !editPrompt.trim() ||
                !!editPromptError
              }
              className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation flex items-center justify-center gap-2"
            >
              {isEditing && <Loader size="sm" className="text-white" />}
              {isEditing
                ? UI_TEXT.EDITING_RESUME_BUTTON
                : UI_TEXT.GENERATE_EDITED_RESUME_BUTTON}
            </button>
          </TourTarget>
        </div>
      </div>
    </>
  );
}
