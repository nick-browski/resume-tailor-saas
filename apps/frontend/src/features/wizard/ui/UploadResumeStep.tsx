import React, { useCallback, useState } from "react";
import {
  FILE_CONSTANTS,
  TIMING_CONSTANTS,
  TEXTAREA_CONSTANTS,
} from "@/shared/lib/constants";

interface UploadResumeStepProps {
  onNext: () => void;
}

type UploadMode = "file" | "text";

export function UploadResumeStep({ onNext }: UploadResumeStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileFromInput = event.target.files?.[0];
      if (fileFromInput) {
        setSelectedFile(fileFromInput);
      }
    },
    []
  );

  const handleResumeTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setResumeText(event.target.value);
    },
    []
  );

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setIsUploading(true);

      // TODO: Implement actual upload logic with documentsApi.create()
      setTimeout(() => {
        setIsUploading(false);
        onNext();
      }, TIMING_CONSTANTS.UPLOAD_DELAY_MS);
    },
    [onNext]
  );

  const canProceedToNextStep =
    uploadMode === "file"
      ? selectedFile !== null
      : resumeText.trim().length > 0;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          Step 1: Upload Your Resume
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Upload your resume as a PDF file or paste it as text.
        </p>
      </div>

      {/* Upload mode toggle */}
      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4">
        <button
          type="button"
          onClick={() => setUploadMode("file")}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
            uploadMode === "file"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Upload PDF
        </button>
        <button
          type="button"
          onClick={() => setUploadMode("text")}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
            uploadMode === "text"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Paste Text
        </button>
      </div>

      {/* File upload */}
      {uploadMode === "file" && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Resume PDF
          </label>
          <div className="mt-1 flex justify-center px-3 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center w-full">
              <svg
                className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
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
              <div className="flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm text-gray-600 gap-1">
                <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept={FILE_CONSTANTS.ACCEPTED_TYPES}
                    onChange={handleFileInputChange}
                  />
                </label>
                <p className="hidden sm:inline pl-1">or drag and drop</p>
                <p className="sm:hidden text-xs">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF up to {FILE_CONSTANTS.MAX_SIZE_MB}MB
              </p>
              {selectedFile && (
                <p className="mt-2 text-xs sm:text-sm text-gray-900 font-medium break-words px-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Text input */}
      {uploadMode === "text" && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Resume Text
          </label>
          <textarea
            value={resumeText}
            onChange={handleResumeTextChange}
            rows={TEXTAREA_CONSTANTS.RESUME_ROWS}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Paste your resume content here..."
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!canProceedToNextStep || isUploading}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {isUploading ? "Uploading..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
