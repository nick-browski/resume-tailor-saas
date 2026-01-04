import { useState, useEffect } from "react";

const PRIVACY_NOTICE_STORAGE_KEY = "privacy-notice-shown";

export function PrivacyNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(PRIVACY_NOTICE_STORAGE_KEY);
    if (!hasShown) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(PRIVACY_NOTICE_STORAGE_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 sm:p-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 mt-0.5 sm:mt-0.5">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-blue-900 leading-relaxed break-words">
            <span className="font-medium">Your privacy matters.</span>{" "}
            <span className="hidden sm:inline">
              Unlike others, we delete your data in 2 hours. Anonymous
              authentication ensures privacy. Full control over your resume
              transformation-everything is up to you.
            </span>
            <span className="sm:hidden">
              We delete your data in 2 hours. Anonymous auth. Full control.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors touch-manipulation p-0.5 sm:p-0"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
