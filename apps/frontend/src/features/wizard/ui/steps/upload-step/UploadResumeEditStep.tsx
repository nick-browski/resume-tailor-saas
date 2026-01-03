import { useState } from "react";
import { UI_TEXT, DOCUMENT_STATUS } from "@/shared/lib/constants";
import { useWizardStore } from "../../../model/wizardStore";
import { useDocumentById } from "../../../api/useDocuments";
import { Loader } from "@/shared/ui";
import { useEditAndTransform } from "../../../hooks";
import { ResumeUploadSection, EditPromptSection } from "../../sections";

interface UploadResumeEditStepProps {
  onNext: () => void;
}

export function UploadResumeEditStep({ onNext }: UploadResumeEditStepProps) {
  const resumeData = useWizardStore((state) => state.resumeData);
  const uploadMode = useWizardStore((state) => state.uploadMode);
  const documentId = useWizardStore((state) => state.documentId);
  const generationToastId = useWizardStore((state) => state.generationToastId);
  const { data: currentDocument } = useDocumentById(documentId);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editPromptError, setEditPromptError] = useState<string | null>(null);

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
        isGenerationInProgress={isGenerationInProgress}
        hasAttemptedSubmit={hasAttemptedSubmit}
        validationError={validationError}
        onValidationError={setValidationError}
      />

      <EditPromptSection
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
      </div>
    </div>
  );
}
