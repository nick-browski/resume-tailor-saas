import { useCallback, useState, useEffect } from "react";
import {
  TEXTAREA_CONSTANTS,
  UI_TEXT,
  UPLOAD_MODE,
  VALIDATION_CONSTANTS,
} from "@/shared/lib/constants";
import { FileUploadArea, UploadedFileCard } from "@/shared/ui";
import { useWizardStore } from "../../../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { validateFile, validateResumeText } from "../../../schemas";
import { ValidationHint } from "../../validation";

interface InitialStepProps {
  onSelectEdit: () => void;
  onSelectTailor: () => void;
}

export function InitialStep({
  onSelectEdit,
  onSelectTailor,
}: InitialStepProps) {
  const resumeData = useWizardStore((state) => state.resumeData);
  const uploadMode = useWizardStore((state) => state.uploadMode);
  const setResumeData = useWizardStore((state) => state.setResumeData);
  const setUploadMode = useWizardStore((state) => state.setUploadMode);
  const toast = useToastContext();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasAttemptedValidation, setHasAttemptedValidation] = useState(false);

  const resumeTextContent =
    uploadMode === UPLOAD_MODE.TEXT ? resumeData?.text || "" : "";

  useEffect(() => {
    setValidationError(null);
    setHasAttemptedValidation(false);
  }, [uploadMode]);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setResumeData({ file: selectedFile, text: "" });
      if (hasAttemptedValidation) {
        const fileValidationResult = await validateFile(selectedFile);
        setValidationError(
          fileValidationResult.success
            ? null
            : fileValidationResult.error || null
        );
      } else {
        setValidationError(null);
      }
      toast.showSuccess(UI_TEXT.FILE_SELECTED_SUCCESS);
    },
    [setResumeData, toast, hasAttemptedValidation]
  );

  const handleResumeTextChange = useCallback(
    (textAreaChangeEvent: React.ChangeEvent<HTMLTextAreaElement>) => {
      const resumeTextValue = textAreaChangeEvent.target.value;
      setResumeData({ file: null, text: resumeTextValue });
      if (hasAttemptedValidation && resumeTextValue.trim()) {
        const textValidationResult = validateResumeText(resumeTextValue);
        setValidationError(
          textValidationResult.success
            ? null
            : textValidationResult.error || null
        );
      } else {
        setValidationError(null);
      }
    },
    [setResumeData, hasAttemptedValidation]
  );

  const handleRemoveFile = useCallback(() => {
    setResumeData({
      file: null,
      text: "",
    });
    setValidationError(null);
    setHasAttemptedValidation(false);
  }, [setResumeData]);

  const validateResume = useCallback(async (): Promise<boolean> => {
    setHasAttemptedValidation(true);

    if (uploadMode === UPLOAD_MODE.FILE) {
      if (!resumeData?.file) {
        setValidationError(UI_TEXT.FILE_REQUIRED_ERROR);
        toast.showError(UI_TEXT.PLEASE_SELECT_FILE);
        return false;
      }
      const fileValidationResult = await validateFile(resumeData.file);
      if (!fileValidationResult.success) {
        setValidationError(fileValidationResult.error || null);
        return false;
      }
    } else {
      if (!resumeData?.text?.trim()) {
        setValidationError(
          UI_TEXT.TEXT_MIN_LENGTH_MESSAGE(
            VALIDATION_CONSTANTS.RESUME_TEXT_MIN_LENGTH
          )
        );
        toast.showError(UI_TEXT.PLEASE_ENTER_RESUME_TEXT);
        return false;
      }
      const textValidationResult = validateResumeText(resumeData.text);
      if (!textValidationResult.success) {
        setValidationError(textValidationResult.error || null);
        return false;
      }
    }

    setValidationError(null);
    return true;
  }, [uploadMode, resumeData, toast]);

  const handleScenarioSelect = useCallback(
    async (onScenarioSelect: () => void) => {
      const isResumeValidated = await validateResume();
      if (isResumeValidated) {
        onScenarioSelect();
      }
    },
    [validateResume]
  );

  const isResumeValid =
    !validationError && (resumeData?.file || resumeData?.text?.trim());

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          {UI_TEXT.INITIAL_STEP_TITLE}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {UI_TEXT.INITIAL_STEP_DESCRIPTION}
        </p>
      </div>

      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4">
        <button
          type="button"
          onClick={() => setUploadMode(UPLOAD_MODE.FILE)}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
            uploadMode === UPLOAD_MODE.FILE
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {UI_TEXT.UPLOAD_PDF_BUTTON}
        </button>
        <button
          type="button"
          onClick={() => setUploadMode(UPLOAD_MODE.TEXT)}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
            uploadMode === UPLOAD_MODE.TEXT
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {UI_TEXT.PASTE_TEXT_BUTTON}
        </button>
      </div>

      {uploadMode === UPLOAD_MODE.FILE && (
        <div>
          <label className="block mb-3 text-sm font-semibold text-gray-900">
            {UI_TEXT.RESUME_PDF_LABEL}
          </label>

          {resumeData?.file ? (
            <div className="space-y-3">
              <UploadedFileCard
                fileName={resumeData.file.name}
                fileSizeBytes={resumeData.file.size}
                onReplace={handleFileSelect}
                onRemove={handleRemoveFile}
              />
              <ValidationHint
                hasAttemptedSubmit={hasAttemptedValidation}
                validationError={validationError}
                hintText={UI_TEXT.FILE_VALIDATION_HINT}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <FileUploadArea
                onFileSelect={handleFileSelect}
                hasError={hasAttemptedValidation && !!validationError}
              />
              <ValidationHint
                hasAttemptedSubmit={hasAttemptedValidation}
                validationError={validationError}
                hintText={UI_TEXT.FILE_VALIDATION_HINT}
              />
            </div>
          )}
        </div>
      )}

      {uploadMode === UPLOAD_MODE.TEXT && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {UI_TEXT.RESUME_TEXT_LABEL}
          </label>
          <textarea
            value={resumeTextContent}
            onChange={handleResumeTextChange}
            rows={TEXTAREA_CONSTANTS.RESUME_ROWS}
            className={`w-full px-3 py-2 text-base border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto resize-none transition-colors ${
              hasAttemptedValidation && validationError
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            placeholder={UI_TEXT.RESUME_TEXT_PLACEHOLDER}
          />
          <ValidationHint
            hasAttemptedSubmit={hasAttemptedValidation}
            validationError={validationError}
            hintText={UI_TEXT.TEXT_VALIDATION_HINT}
            currentLength={
              resumeTextContent ? resumeTextContent.length : undefined
            }
            maxLength={VALIDATION_CONSTANTS.RESUME_TEXT_MAX_LENGTH}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={() => handleScenarioSelect(onSelectEdit)}
          disabled={!isResumeValid}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {UI_TEXT.EDIT_RESUME_BUTTON}
        </button>
        <button
          type="button"
          onClick={() => handleScenarioSelect(onSelectTailor)}
          disabled={!isResumeValid}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {UI_TEXT.TAILOR_RESUME_BUTTON}
        </button>
      </div>
    </div>
  );
}
