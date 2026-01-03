import { useCallback, useState } from "react";
import {
  TEXTAREA_CONSTANTS,
  TOAST_MESSAGES,
  UI_TEXT,
  QUERY_KEYS,
  VALIDATION_CONSTANTS,
} from "@/shared/lib/constants";
import { useGenerateResume } from "../api/useGenerate";
import { useCreateDocument } from "../api/useDocuments";
import { useWizardStore } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { Loader } from "@/shared/ui";
import { useQueryClient } from "@tanstack/react-query";
import { validateJobDescription } from "../schemas";
import { ValidationHint } from "./ValidationHint";

interface JobDescriptionStepProps {
  onPrevious: () => void;
}

export function JobDescriptionStep({ onPrevious }: JobDescriptionStepProps) {
  const jobDescriptionText = useWizardStore(
    (state) => state.jobDescriptionText
  );
  const setJobDescriptionText = useWizardStore(
    (state) => state.setJobDescriptionText
  );
  const resumeData = useWizardStore((state) => state.resumeData);
  const documentId = useWizardStore((state) => state.documentId);
  const setDocumentId = useWizardStore((state) => state.setDocumentId);
  const setMaxReachedStep = useWizardStore((state) => state.setMaxReachedStep);
  const generationToastId = useWizardStore((state) => state.generationToastId);
  const setGenerationToastId = useWizardStore(
    (state) => state.setGenerationToastId
  );
  const { mutateAsync: createDocument, isPending: isCreatingDocument } =
    useCreateDocument();
  const { mutateAsync: generateResume, isPending: isStartingGeneration } =
    useGenerateResume();
  const toast = useToastContext();
  const queryClient = useQueryClient();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const handleJobDescriptionTextChange = useCallback(
    (textAreaChangeEvent: React.ChangeEvent<HTMLTextAreaElement>) => {
      const jobDescriptionTextValue = textAreaChangeEvent.target.value;
      setJobDescriptionText(jobDescriptionTextValue);
      if (hasAttemptedSubmit && jobDescriptionTextValue.trim()) {
        const validationResult = validateJobDescription(
          jobDescriptionTextValue
        );
        setValidationError(
          validationResult.success ? null : validationResult.error || null
        );
      } else {
        setValidationError(null);
      }
    },
    [setJobDescriptionText, hasAttemptedSubmit]
  );

  const handleFormSubmit = useCallback(
    async (formSubmitEventHandler: React.FormEvent) => {
      formSubmitEventHandler.preventDefault();
      if (!resumeData || generationToastId) {
        return;
      }

      setHasAttemptedSubmit(true);

      if (!jobDescriptionText.trim()) {
        setValidationError(UI_TEXT.JOB_DESCRIPTION_REQUIRED_ERROR);
        toast.showError(UI_TEXT.JOB_DESCRIPTION_REQUIRED_ERROR);
        return;
      }

      const jobDescriptionValidationResult =
        validateJobDescription(jobDescriptionText);
      if (!jobDescriptionValidationResult.success) {
        setValidationError(jobDescriptionValidationResult.error || null);
        return;
      }

      try {
        const createDocumentToastId = toast.showLoading(
          TOAST_MESSAGES.CREATING_DOCUMENT
        );
        const createDocumentResponse = await createDocument({
          file: resumeData.file || undefined,
          resumeText: resumeData.text || undefined,
          jobText: jobDescriptionText,
        });
        toast.dismissLoading(createDocumentToastId);

        const previousDocumentId = documentId;
        const createdDocumentId = createDocumentResponse.id;

        if (previousDocumentId && previousDocumentId !== createdDocumentId) {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.DOCUMENTS, previousDocumentId],
          });
        }

        setDocumentId(createdDocumentId);
        setMaxReachedStep(2 as 1 | 2 | 3);

        const loadingToastId = toast.showLoading(
          TOAST_MESSAGES.STARTING_RESUME_GENERATION
        );
        setGenerationToastId(loadingToastId);

        await generateResume({
          documentId: createdDocumentId,
        });
      } catch (generationError) {
        if (generationToastId) {
          toast.dismissLoading(generationToastId);
          setGenerationToastId(null);
        }

        const errorMessage =
          generationError instanceof Error
            ? generationError.message
            : TOAST_MESSAGES.CREATE_DOCUMENT_OR_GENERATE_RESUME_FAILED;
        toast.showError(errorMessage);
        console.error(
          TOAST_MESSAGES.CREATE_DOCUMENT_OR_GENERATE_RESUME_FAILED,
          generationError
        );
      }
    },
    [
      jobDescriptionText,
      resumeData,
      generationToastId,
      createDocument,
      generateResume,
      setDocumentId,
      setMaxReachedStep,
      setGenerationToastId,
      toast,
      documentId,
      queryClient,
    ]
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          {UI_TEXT.JOB_DESCRIPTION_STEP_TITLE}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {UI_TEXT.JOB_DESCRIPTION_STEP_DESCRIPTION}
        </p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {UI_TEXT.JOB_DESCRIPTION_LABEL}
        </label>
        <textarea
          value={jobDescriptionText}
          onChange={handleJobDescriptionTextChange}
          rows={TEXTAREA_CONSTANTS.JOB_DESCRIPTION_ROWS}
          className={`w-full px-3 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 transition-colors ${
            hasAttemptedSubmit && validationError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
          placeholder={UI_TEXT.JOB_DESCRIPTION_PLACEHOLDER}
          disabled={
            isCreatingDocument || isStartingGeneration || !!generationToastId
          }
        />
        <ValidationHint
          hasAttemptedSubmit={hasAttemptedSubmit}
          validationError={validationError}
          hintText={UI_TEXT.JOB_DESCRIPTION_VALIDATION_HINT(
            VALIDATION_CONSTANTS.JOB_DESCRIPTION_MIN_LENGTH,
            VALIDATION_CONSTANTS.JOB_DESCRIPTION_MAX_LENGTH
          )}
          currentLength={
            jobDescriptionText ? jobDescriptionText.length : undefined
          }
          maxLength={VALIDATION_CONSTANTS.JOB_DESCRIPTION_MAX_LENGTH}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 pt-2">
        <button
          type="button"
          onClick={onPrevious}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
        >
          {UI_TEXT.BACK_BUTTON}
        </button>
        <button
          type="submit"
          disabled={
            !resumeData ||
            isCreatingDocument ||
            isStartingGeneration ||
            !!generationToastId
          }
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation flex items-center justify-center gap-2"
        >
          {(isCreatingDocument ||
            isStartingGeneration ||
            generationToastId) && <Loader size="sm" className="text-white" />}
          {isCreatingDocument || isStartingGeneration || generationToastId
            ? UI_TEXT.GENERATING_BUTTON
            : UI_TEXT.GENERATE_TAILORED_RESUME_BUTTON}
        </button>
      </div>
    </form>
  );
}
