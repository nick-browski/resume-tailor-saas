export function appendOptionalJsonField<T>(
  formData: FormData,
  fieldName: string,
  fieldValue: T | undefined | null
): void {
  if (fieldValue !== undefined && fieldValue !== null) {
    formData.append(fieldName, JSON.stringify(fieldValue));
  }
}

export function createMultipartFormData(
  file: File | undefined,
  resumeText: string | undefined,
  jobText: string | undefined,
  customFieldNames?: {
    file?: string;
    resumeText?: string;
    jobText?: string;
  }
): FormData {
  const formData = new FormData();
  const fileFieldName = customFieldNames?.file || "file";
  const resumeTextFieldName = customFieldNames?.resumeText || "resumeText";
  const jobTextFieldName = customFieldNames?.jobText || "jobText";

  if (file) {
    formData.append(fileFieldName, file);
  }

  if (resumeText) {
    formData.append(resumeTextFieldName, resumeText);
  }

  if (jobText) {
    formData.append(jobTextFieldName, jobText);
  }

  return formData;
}
