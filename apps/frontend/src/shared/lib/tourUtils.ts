export const SKIP_ALL_TOURS_KEY = "tour-skipped-all";
export const INITIAL_TOUR_KEY = "tour-initial";
export const EDIT_UPLOAD_TOUR_KEY = "tour-edit-upload";
export const EDIT_PREVIEW_TOUR_KEY = "tour-edit-preview";
export const JOB_DESCRIPTION_TOUR_KEY = "tour-job-description";
export const PREVIEW_TOUR_KEY = "tour-preview";

const EDIT_TOUR_KEYS = [
  INITIAL_TOUR_KEY,
  EDIT_UPLOAD_TOUR_KEY,
  EDIT_PREVIEW_TOUR_KEY,
];

const TAILOR_TOUR_KEYS = [
  INITIAL_TOUR_KEY,
  JOB_DESCRIPTION_TOUR_KEY,
  PREVIEW_TOUR_KEY,
];

export const ALL_TOUR_KEYS = [
  ...new Set([...EDIT_TOUR_KEYS, ...TAILOR_TOUR_KEYS]),
];

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
