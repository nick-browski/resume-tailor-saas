import { useState, useCallback } from "react";
import {
  TIMING_CONSTANTS,
  FILE_CONSTANTS,
  DOM_CONSTANTS,
  TOAST_MESSAGES,
} from "@/shared/lib/constants";
import { documentsApi } from "@/shared/api";
import { useToastContext } from "@/app/providers/ToastProvider";

interface UseResumeDownloadProps {
  documentId: string | null;
  pdfResultPath: string | null;
}

export function useResumeDownload({
  documentId,
  pdfResultPath,
}: UseResumeDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToastContext();

  const handleResumeDownload = useCallback(async () => {
    if (!pdfResultPath || !documentId) return;

    setIsDownloading(true);

    try {
      const pdfFileBlob = await documentsApi.downloadPDF(documentId);
      const temporaryDownloadUrl = URL.createObjectURL(pdfFileBlob);
      const downloadAnchorElement = document.createElement(
        DOM_CONSTANTS.ANCHOR_ELEMENT_TAG
      );
      downloadAnchorElement.href = temporaryDownloadUrl;
      downloadAnchorElement.download = FILE_CONSTANTS.PDF_DOWNLOAD_FILENAME;
      document.body.appendChild(downloadAnchorElement);
      downloadAnchorElement.click();
      document.body.removeChild(downloadAnchorElement);
      URL.revokeObjectURL(temporaryDownloadUrl);

      toast.showSuccess(TOAST_MESSAGES.RESUME_DOWNLOADED_SUCCESS);
    } catch (downloadError) {
      toast.showError(TOAST_MESSAGES.RESUME_DOWNLOAD_FAILED);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
      }, TIMING_CONSTANTS.DOWNLOAD_DELAY_MS);
    }
  }, [pdfResultPath, documentId, toast]);

  return { isDownloading, handleResumeDownload };
}
