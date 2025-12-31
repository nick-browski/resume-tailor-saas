import React, { useCallback, useState } from "react";

interface JobDescriptionStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function JobDescriptionStep({
  onNext,
  onPrevious,
}: JobDescriptionStepProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setJobDescription(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!jobDescription.trim()) return;

      setIsGenerating(true);

      // TODO: Implement actual API call to generate tailored resume
      // For now, just proceed to next step
      setTimeout(() => {
        setIsGenerating(false);
        onNext();
      }, 1000);
    },
    [jobDescription, onNext]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
          value={jobDescription}
          onChange={handleTextChange}
          rows={12}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Paste the complete job description here, including requirements, responsibilities, and qualifications..."
          required
        />
        <p className="mt-2 text-xs sm:text-sm text-gray-500">
          {jobDescription.length} characters
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
          disabled={!jobDescription.trim() || isGenerating}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {isGenerating ? "Generating..." : "Generate Tailored Resume"}
        </button>
      </div>
    </form>
  );
}

