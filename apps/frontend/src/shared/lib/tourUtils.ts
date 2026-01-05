const SKIP_ALL_TOURS_KEY = "resume-tailor-tour-skipped-all";

const EDIT_TOUR_KEYS = [
  "resume-tailor-tour-initial-step",
  "resume-tailor-tour-upload-edit-step",
  "resume-tailor-tour-edit-preview-step",
];

const TAILOR_TOUR_KEYS = [
  "resume-tailor-tour-initial-step",
  "resume-tailor-tour-job-description-step",
  "resume-tailor-tour-preview-step",
];

const ALL_TOUR_KEYS = [...new Set([...EDIT_TOUR_KEYS, ...TAILOR_TOUR_KEYS])];

export function hasSkippedAllTours(): boolean {
  return localStorage.getItem(SKIP_ALL_TOURS_KEY) === "true";
}

export function skipAllTours(): void {
  localStorage.setItem(SKIP_ALL_TOURS_KEY, "true");
  ALL_TOUR_KEYS.forEach((key) => {
    localStorage.setItem(key, "true");
  });
}

export function isAnyTourActive(scenario: "edit" | "tailor" | null): boolean {
  if (hasSkippedAllTours()) {
    return false;
  }

  const tourKeys = scenario
    ? scenario === "edit"
      ? EDIT_TOUR_KEYS
      : TAILOR_TOUR_KEYS
    : ALL_TOUR_KEYS;

  const allToursCompleted = tourKeys.every(
    (key) => localStorage.getItem(key) === "true"
  );

  return !allToursCompleted;
}
