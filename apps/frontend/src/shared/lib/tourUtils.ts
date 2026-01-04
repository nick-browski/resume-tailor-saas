const SKIP_ALL_TOURS_KEY = "resume-tailor-tour-skipped-all";

// All tour storage keys for different steps
const ALL_TOUR_KEYS = [
  "resume-tailor-tour-initial-step",
  "resume-tailor-tour-upload-step",
  "resume-tailor-tour-upload-edit-step",
  "resume-tailor-tour-job-description-step",
  "resume-tailor-tour-preview-step",
  "resume-tailor-tour-edit-preview-step",
];

export function hasSkippedAllTours(): boolean {
  return localStorage.getItem(SKIP_ALL_TOURS_KEY) === "true";
}

export function skipAllTours(): void {
  localStorage.setItem(SKIP_ALL_TOURS_KEY, "true");
  // Mark all individual tours as completed
  ALL_TOUR_KEYS.forEach((key) => {
    localStorage.setItem(key, "true");
  });
}

