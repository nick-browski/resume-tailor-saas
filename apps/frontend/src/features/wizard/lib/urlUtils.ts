// URL query parameter names
export const URL_QUERY_PARAMS = {
  STEP: "step",
  DOCUMENT_ID: "docId",
  SCENARIO: "scenario",
} as const;

// Reads URL query parameter
export function getUrlParam(paramName: string): string | null {
  if (typeof window === "undefined") return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(paramName);
}

// Updates URL query parameter
export function updateUrlParam(paramName: string, value: string | null): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(paramName, value);
  } else {
    url.searchParams.delete(paramName);
  }
  window.history.pushState({}, "", url.toString());
}
