import React, { useCallback, useState } from "react";
import { TEXTAREA_CONSTANTS } from "@/shared/lib/constants";
import { useGenerateResume } from "../api/useGenerate";
import { useCreateDocument } from "../api/useDocuments";
import { useWizardStore } from "../model/wizardStore";

interface JobDescriptionStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function JobDescriptionStep({
  onNext,
  onPrevious,
}: JobDescriptionStepProps) {
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const resumeData = useWizardStore((state) => state.resumeData);
  const setDocumentId = useWizardStore((state) => state.setDocumentId);
  const createDocument = useCreateDocument();
  const generateResume = useGenerateResume();

  const handleJobDescriptionTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setJobDescriptionText(event.target.value);
    },
    []
  );

  const handleFormSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!jobDescriptionText.trim() || !resumeData) return;

      try {
        // Create document with resume and job description
        const createResponse = await createDocument.mutateAsync({
          file: resumeData.file || undefined,
          resumeText: resumeData.text || undefined,
          jobText: jobDescriptionText,
        });

        const documentId = createResponse.id;
        setDocumentId(documentId);

        // Start generation
        await generateResume.mutateAsync({ documentId });
        onNext();
      } catch (error) {
        console.error("Failed to create document or generate resume:", error);
        // TODO: Show error message to user
      }
    },
    [jobDescriptionText, resumeData, createDocument, generateResume, setDocumentId, onNext]
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          Step 2: Paste Job Description
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Paste the job description you want to tailor your resume for.
        </p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Job Description
        </label>
        <textarea
          value={jobDescriptionText}
          onChange={handleJobDescriptionTextChange}
          rows={TEXTAREA_CONSTANTS.JOB_DESCRIPTION_ROWS}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Paste the complete job description here, including requirements, responsibilities, and qualifications..."
          required
        />
        <p className="mt-2 text-xs sm:text-sm text-gray-500">
          {jobDescriptionText.length} characters
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0 pt-2">
        <button
          type="button"
          onClick={onPrevious}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!jobDescriptionText.trim() || !resumeData || createDocument.isPending || generateResume.isPending}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {createDocument.isPending || generateResume.isPending ? "Generating..." : "Generate Tailored Resume"}
        </button>
      </div>
    </form>
  );
}
