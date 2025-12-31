import { useCallback, useState } from "react";
import { FILE_CONSTANTS, TIMING_CONSTANTS } from "@/shared/lib/constants";

interface PreviewStepProps {
  onPrevious: () => void;
  onReset: () => void;
}

// TODO: Replace with actual data from API/store (useDocumentById hook)
const MOCK_TAILORED_RESUME = `# John Doe
Software Engineer

## Experience

### Senior Software Engineer | Tech Company Inc. | 2020 - Present
- Led development of scalable microservices architecture using React and Node.js
- Implemented CI/CD pipelines reducing deployment time by 40%
- Collaborated with cross-functional teams to deliver high-quality software solutions

### Software Engineer | Startup Co. | 2018 - 2020
- Developed responsive web applications using modern JavaScript frameworks
- Optimized database queries improving application performance by 30%
- Participated in agile development processes and code reviews

## Skills
- React, TypeScript, Node.js
- Cloud platforms (AWS, GCP)
- CI/CD, Docker, Kubernetes`;

export function PreviewStep({ onPrevious, onReset }: PreviewStepProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleResumeDownload = useCallback(async () => {
    setIsDownloading(true);

    // TODO: Implement actual download logic using document.pdfResultPath or tailoredText
    const resumeBlob = new Blob([MOCK_TAILORED_RESUME], {
      type: FILE_CONSTANTS.MARKDOWN_MIME_TYPE,
    });
    const downloadUrl = URL.createObjectURL(resumeBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = FILE_CONSTANTS.DEFAULT_FILENAME;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);

    setTimeout(() => {
      setIsDownloading(false);
    }, TIMING_CONSTANTS.DOWNLOAD_DELAY_MS);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
          Step 3: Preview & Download
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Review your tailored resume and download it when ready.
        </p>
      </div>

      {/* Preview */}
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Tailored Resume Preview
        </label>
        <div className="border border-gray-300 rounded-md p-3 sm:p-4 bg-gray-50 max-h-80 sm:max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-gray-800">
            {MOCK_TAILORED_RESUME}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onPrevious}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors touch-manipulation"
          >
            Start Over
          </button>
        </div>
        <button
          type="button"
          onClick={handleResumeDownload}
          disabled={isDownloading}
          className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          {isDownloading ? "Downloading..." : "Download Resume"}
        </button>
      </div>
    </div>
  );
}
