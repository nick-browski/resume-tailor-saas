import { useCallback } from "react";
import {
  FILE_CONSTANTS,
  TEXTAREA_CONSTANTS,
  DOCUMENT_STATUS,
  UI_TEXT,
  UPLOAD_MODE,
} from "@/shared/lib/constants";
import { useWizardStore } from "../model/wizardStore";
import { useToastContext } from "@/app/providers/ToastProvider";
import { useDocumentById } from "../api/useDocuments";

interface UploadResumeStepProps {
  onNext: () => void;
}

export function UploadResumeStep({ onNext }: UploadResumeStepProps) {
  const resumeData = useWizardStore((state) => state.resumeData);
  const uploadMode = useWizardStore((state) => state.uploadMode);
  const setResumeData = useWizardStore((state) => state.setResumeData);
  const setUploadMode = useWizardStore((state) => state.setUploadMode);
  const documentId = useWizardStore((state) => state.documentId);
  const { data: currentDocument } = useDocumentById(documentId);
  const toast = useToastContext();

  const isGenerationInProgress =
    documentId !== null &&
    currentDocument?.status !== undefined &&
    currentDocument.status !== DOCUMENT_STATUS.GENERATED &&
    currentDocument.status !== DOCUMENT_STATUS.FAILED;

  const resumeTextContent =
    uploadMode === UPLOAD_MODE.TEXT ? resumeData?.text || "" : "";

  const validateFile = useCallback(
    (fileToValidate: File): boolean => {
      const maxSizeInBytes =
        FILE_CONSTANTS.MAX_SIZE_MB *
        FILE_CONSTANTS.BYTES_PER_KB *
        FILE_CONSTANTS.BYTES_PER_KB;
      if (fileToValidate.size > maxSizeInBytes) {
        toast.showError(
          `${UI_TEXT.FILE_SIZE_EXCEEDS_LIMIT} ${FILE_CONSTANTS.MAX_SIZE_MB}${UI_TEXT.MB_LIMIT_TEXT}`
        );
        return false;
      }

      if (!fileToValidate.type.includes(FILE_CONSTANTS.PDF_MIME_TYPE)) {
        toast.showError(UI_TEXT.PLEASE_UPLOAD_PDF);
        return false;
      }

      return true;
    },
    [toast]
  );

  const handleFileInputChange = useCallback(
    (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
      if (isGenerationInProgress) return;

      const selectedFile = changeEvent.target.files?.[0];
      if (selectedFile && validateFile(selectedFile)) {
        setResumeData({
          file: selectedFile,
          text: "",
        });
        toast.showSuccess(UI_TEXT.FILE_SELECTED_SUCCESS);
      }
    },
    [isGenerationInProgress, validateFile, setResumeData, toast]
  );

  const handleResumeTextChange = useCallback(
    (changeEvent: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isGenerationInProgress) return;

      setResumeData({
        file: null,
        text: changeEvent.target.value,
      });
    },
    [isGenerationInProgress, setResumeData]
  );

  const handleDragOver = useCallback(
    (dragEvent: React.DragEvent<HTMLDivElement>) => {
      if (isGenerationInProgress) {
        dragEvent.preventDefault();
        return;
      }
      dragEvent.preventDefault();
      dragEvent.stopPropagation();
    },
    [isGenerationInProgress]
  );

  const handleDrop = useCallback(
    (dropEvent: React.DragEvent<HTMLDivElement>) => {
      if (isGenerationInProgress) {
        dropEvent.preventDefault();
        return;
      }

      dropEvent.preventDefault();
      dropEvent.stopPropagation();

      const droppedFile = dropEvent.dataTransfer.files?.[0];
      if (droppedFile && validateFile(droppedFile)) {
        setResumeData({
          file: droppedFile,
          text: "",
        });
        toast.showSuccess(UI_TEXT.FILE_SELECTED_SUCCESS);
      }
    },
    [isGenerationInProgress, validateFile, setResumeData, toast]
  );

  const handleFormSubmit = useCallback(
    (formSubmitEvent: React.FormEvent) => {
      formSubmitEvent.preventDefault();

      if (isGenerationInProgress) return;

      if (uploadMode === UPLOAD_MODE.FILE && !resumeData?.file) {
        toast.showError(UI_TEXT.PLEASE_SELECT_FILE);
        return;
      }

      if (uploadMode === UPLOAD_MODE.TEXT && !resumeData?.text?.trim()) {
        toast.showError(UI_TEXT.PLEASE_ENTER_RESUME_TEXT);
        return;
      }

      const successMessage =
        uploadMode === UPLOAD_MODE.FILE
          ? UI_TEXT.RESUME_UPLOADED_SUCCESS
          : UI_TEXT.RESUME_TEXT_SAVED;
      toast.showSuccess(successMessage);
      onNext();
    },
    [uploadMode, resumeData, onNext, toast, isGenerationInProgress]
  );

  const canProceedToNextStep =
    uploadMode === UPLOAD_MODE.FILE
      ? resumeData?.file !== null
      : (resumeData?.text?.trim().length || 0) > 0;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          {UI_TEXT.UPLOAD_RESUME_STEP_TITLE}
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          {UI_TEXT.UPLOAD_RESUME_STEP_DESCRIPTION}
        </p>
      </div>

      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4">
        <button
          type="button"
          onClick={() => {
            if (!isGenerationInProgress) {
              setUploadMode(UPLOAD_MODE.FILE);
            }
          }}
          disabled={isGenerationInProgress}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            uploadMode === UPLOAD_MODE.FILE
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {UI_TEXT.UPLOAD_PDF_BUTTON}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isGenerationInProgress) {
              setUploadMode(UPLOAD_MODE.TEXT);
            }
          }}
          disabled={isGenerationInProgress}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
          <label className="block mb-2 text-sm font-medium text-gray-700">
            {UI_TEXT.RESUME_PDF_LABEL}
          </label>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`mt-1 flex justify-center px-3 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-6 border-2 border-dashed rounded-lg transition-colors ${
              isGenerationInProgress
                ? "border-gray-200 bg-gray-50 cursor-not-allowed pointer-events-none"
                : resumeData?.file
                ? "border-green-500 bg-green-50 hover:border-green-600"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="space-y-1 text-center w-full">
              <svg
                className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 transition-colors ${
                  resumeData?.file ? "text-green-600" : "text-gray-400"
                }`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm gap-1">
                {isGenerationInProgress ? (
                  <p className="text-gray-500 font-medium">
                    {UI_TEXT.GENERATING_RESUME_TEXT}
                  </p>
                ) : resumeData?.file ? (
                  <>
                    <label className="relative rounded-md font-medium cursor-pointer text-green-600 hover:text-green-700">
                      <span>{UI_TEXT.CHANGE_FILE_TEXT}</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept={FILE_CONSTANTS.ACCEPTED_TYPES}
                        onChange={handleFileInputChange}
                        disabled={isGenerationInProgress}
                      />
                    </label>
                    <p className="hidden sm:inline pl-1 text-green-600">
                      {UI_TEXT.DRAG_AND_DROP_TEXT}
                    </p>
                    <p className="sm:hidden text-xs text-green-600">
                      {UI_TEXT.DRAG_AND_DROP_TEXT}
                    </p>
                  </>
                ) : (
                  <>
                    <label className="relative rounded-md font-medium cursor-pointer text-blue-600 hover:text-blue-500">
                      <span>{UI_TEXT.UPLOAD_FILE_TEXT}</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept={FILE_CONSTANTS.ACCEPTED_TYPES}
                        onChange={handleFileInputChange}
                        disabled={isGenerationInProgress}
                      />
                    </label>
                    <p className="hidden sm:inline pl-1 text-gray-600">
                      {UI_TEXT.DRAG_AND_DROP_TEXT}
                    </p>
                    <p className="sm:hidden text-xs text-gray-600">
                      {UI_TEXT.DRAG_AND_DROP_TEXT}
                    </p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {UI_TEXT.PDF_SIZE_LIMIT_TEXT} {FILE_CONSTANTS.MAX_SIZE_MB}MB
              </p>
              {resumeData?.file && (
                <p className="mt-2 text-xs sm:text-sm text-green-700 font-medium break-words px-2">
                  {UI_TEXT.SELECTED_FILE_TEXT} {resumeData.file.name}
                </p>
              )}
            </div>
          </div>
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
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            placeholder={UI_TEXT.RESUME_TEXT_PLACEHOLDER}
            disabled={isGenerationInProgress}
          />
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!canProceedToNextStep || isGenerationInProgress}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {UI_TEXT.CONTINUE_BUTTON}
        </button>
      </div>
    </form>
  );
}
