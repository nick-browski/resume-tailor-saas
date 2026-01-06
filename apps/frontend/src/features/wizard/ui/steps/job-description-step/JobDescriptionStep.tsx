import { useCallback, useState } from "react";
import {
  TEXTAREA_CONSTANTS,
  TOAST_MESSAGES,
  UI_TEXT,
  QUERY_KEYS,
  VALIDATION_CONSTANTS,
} from "@/shared/lib/constants";
import { useGenerateResume } from "../../../api/useGenerate";
import { useCreateDocument } from "../../../api/useDocuments";
import { useClassifyContent } from "../../../api/useClassification";
import { useMatchCheck } from "../../../api/useMatchCheck";
import { MatchCheckCard } from "../preview-step/MatchCheckCard";
import type { MatchCheckResult } from "@/shared/api/types";
import { useWizardStore } from "../../../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { Loader, Tour, TourTarget, ClearableTextarea } from "@/shared/ui";
import { useQueryClient } from "@tanstack/react-query";
import { validateJobDescription } from "../../../schemas";
import { ValidationHint, ValidationWarning } from "../../validation";
import { useResumeValidation } from "../../../hooks/useResumeValidation";
import { ResumeUploadSection } from "../../sections";
import { useTourSteps } from "../../../hooks/useTourSteps";
import { JOB_DESCRIPTION_TOUR_KEY } from "@/shared/lib/tourUtils";
import { formatServerError } from "@/shared/lib/errorFormatter";

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
  const uploadMode = useWizardStore((state) => state.uploadMode);
  const enableMatchCheck = useWizardStore((state) => state.enableMatchCheck);
  const setEnableMatchCheck = useWizardStore(
    (state) => state.setEnableMatchCheck
  );
  const documentId = useWizardStore((state) => state.documentId);
  const setDocumentId = useWizardStore((state) => state.setDocumentId);
  const generationToastId = useWizardStore((state) => state.generationToastId);
  const setGenerationToastId = useWizardStore(
    (state) => state.setGenerationToastId
  );
  const reset = useWizardStore((state) => state.reset);
  const { mutateAsync: createDocument, isPending: isCreatingDocument } =
    useCreateDocument();
  const { mutateAsync: generateResume, isPending: isStartingGeneration } =
    useGenerateResume();
  const toast = useToastContext();
  const queryClient = useQueryClient();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [resumeValidationError, setResumeValidationError] = useState<
    string | null
  >(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const resumeValidationErrorFromHook = useResumeValidation(
    resumeData,
    uploadMode
  );
  const {
    classificationErrors,
    isClassifying,
    classifyContentForTailor,
    clearClassificationErrors,
  } = useClassifyContent();
  const { matchErrors, isCheckingMatch, checkMatch, clearMatchErrors } =
    useMatchCheck();

  // Create tour steps with refs
  const { refs, steps: tourSteps } = useTourSteps({
    jobDescriptionTextarea: {
      title: "Enter Job Description",
      content:
        "Paste the job description here. We'll tailor your resume to match the requirements and keywords.",
      position: "top",
    },
    generateButton: {
      title: "Generate Tailored Resume",
      content:
        "Click here to generate your tailored resume optimized for this job description.",
      position: "top",
    },
  });

  // Check if any async operation is in progress
  const isProcessing =
    isCreatingDocument ||
    isStartingGeneration ||
    isClassifying ||
    isCheckingMatch ||
    !!generationToastId;

  const shouldShowMatchCheckErrorCard =
    matchErrors.matchError &&
    matchErrors.matchResult &&
    !matchErrors.matchResult.isMatch;

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

      clearClassificationErrors();
      clearMatchErrors();

      const effectiveResumeValidationError =
        resumeValidationError || resumeValidationErrorFromHook;
      if (!resumeData || generationToastId || effectiveResumeValidationError) {
        if (effectiveResumeValidationError) {
          toast.showError(effectiveResumeValidationError);
        }
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
        // First, classify content (validate resume and job description)
        const classificationResult = await classifyContentForTailor(
          resumeData,
          jobDescriptionText
        );

        if (!classificationResult || !classificationResult.isValid) {
          return;
        }

        // Then, check match if enabled
        let matchCheckResult: MatchCheckResult | null = null;
        if (enableMatchCheck) {
          const matchCheckResponse = await checkMatch(
            resumeData,
            jobDescriptionText
          );

          if (!matchCheckResponse?.isMatch || !matchCheckResponse.matchResult) {
            return;
          }

          matchCheckResult = matchCheckResponse.matchResult;
        }

        const createDocumentToastId = toast.showLoading(
          TOAST_MESSAGES.CREATING_DOCUMENT
        );
        const createDocumentResponse = await createDocument({
          file: resumeData.file || undefined,
          resumeText: classificationResult.extractedResumeText || undefined,
          jobText: jobDescriptionText,
          matchCheckResult,
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

        const errorMessage = formatServerError(generationError);
        toast.showError(errorMessage);
        reset();
      }
    },
    [
      jobDescriptionText,
      resumeData,
      generationToastId,
      enableMatchCheck,
      checkMatch,
      classifyContentForTailor,
      createDocument,
      generateResume,
      setDocumentId,
      setGenerationToastId,
      toast,
      documentId,
      queryClient,
      resumeValidationError,
      resumeValidationErrorFromHook,
      reset,
      clearClassificationErrors,
      clearMatchErrors,
    ]
  );

  return (
    <>
      <Tour steps={tourSteps} storageKey={JOB_DESCRIPTION_TOUR_KEY} />
      <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
            {UI_TEXT.JOB_DESCRIPTION_STEP_TITLE}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {UI_TEXT.JOB_DESCRIPTION_STEP_DESCRIPTION}
          </p>
        </div>

        <ResumeUploadSection
          isGenerationInProgress={isProcessing}
          hasAttemptedSubmit={hasAttemptedSubmit}
          validationError={resumeValidationError}
          onValidationError={setResumeValidationError}
        />

        {!isProcessing &&
          (resumeValidationErrorFromHook || resumeValidationError) && (
            <ValidationWarning
              title={UI_TEXT.RESUME_VALIDATION_REQUIRED_TITLE}
              message={
                resumeValidationErrorFromHook || resumeValidationError || ""
              }
            />
          )}

        {!isProcessing && classificationErrors.resumeError && (
          <ValidationWarning
            title={UI_TEXT.INVALID_RESUME_TITLE}
            message={classificationErrors.resumeError}
          />
        )}

        {!isProcessing && classificationErrors.jobDescriptionError && (
          <ValidationWarning
            title={UI_TEXT.INVALID_JOB_DESCRIPTION_TITLE}
            message={classificationErrors.jobDescriptionError}
          />
        )}

        {!isProcessing &&
          shouldShowMatchCheckErrorCard &&
          matchErrors.matchResult && (
            <MatchCheckCard
              matchCheckResult={matchErrors.matchResult}
              variant="error"
            />
          )}

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {UI_TEXT.JOB_DESCRIPTION_LABEL}
          </label>
          <TourTarget ref={refs.jobDescriptionTextarea}>
            <ClearableTextarea
              value={jobDescriptionText}
              onChange={handleJobDescriptionTextChange}
              onClear={() => setJobDescriptionText("")}
              rows={TEXTAREA_CONSTANTS.JOB_DESCRIPTION_ROWS}
              className={`px-3 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 transition-colors ${
                !isProcessing && hasAttemptedSubmit && validationError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              placeholder={UI_TEXT.JOB_DESCRIPTION_PLACEHOLDER}
              disabled={isProcessing}
            />
          </TourTarget>
          <ValidationHint
            hasAttemptedSubmit={hasAttemptedSubmit}
            validationError={validationError}
            isProcessing={isProcessing}
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

        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableMatchCheck}
              onChange={(e) => setEnableMatchCheck(e.target.checked)}
              disabled={isProcessing}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-700">
              {UI_TEXT.MATCH_CHECK_ENABLED}
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 pt-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 transition duration-150 touch-manipulation"
          >
            {UI_TEXT.BACK_BUTTON}
          </button>
          <TourTarget ref={refs.generateButton}>
            <button
              type="submit"
              disabled={
                !resumeData ||
                !!(resumeValidationError || resumeValidationErrorFromHook) ||
                isProcessing
              }
              className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 transition duration-150 touch-manipulation flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader size="sm" className="text-white" />}
              {isProcessing
                ? UI_TEXT.GENERATING_BUTTON
                : UI_TEXT.GENERATE_TAILORED_RESUME_BUTTON}
            </button>
          </TourTarget>
        </div>
      </form>
    </>
  );
}
