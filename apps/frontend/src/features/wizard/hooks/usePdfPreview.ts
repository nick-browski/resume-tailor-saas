import { useState, useEffect } from "react";
import { DOCUMENT_STATUS } from "@/shared/lib/constants";
import { documentsApi } from "@/shared/api";

interface UsePdfPreviewProps {
  documentId: string | null;
  pdfResultPath: string | null;
  documentStatus: string | undefined;
}

export function usePdfPreview({
  documentId,
  pdfResultPath,
  documentStatus,
}: UsePdfPreviewProps) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const isDocumentReady =
      pdfResultPath &&
      documentStatus === DOCUMENT_STATUS.GENERATED &&
      documentId;

    if (!isDocumentReady) {
      setPdfPreviewUrl(null);
      return;
    }

    let isPdfLoadCancelled = false;

    const loadPdfPreview = async () => {
      try {
        const pdfFileBlob = await documentsApi.downloadPDF(documentId);
        if (isPdfLoadCancelled) {
          URL.revokeObjectURL(URL.createObjectURL(pdfFileBlob));
          return;
        }
        const pdfPreviewBlobUrl = URL.createObjectURL(pdfFileBlob);
        setPdfPreviewUrl(pdfPreviewBlobUrl);
      } catch (pdfLoadError) {
        if (!isPdfLoadCancelled) {
          setPdfPreviewUrl(null);
        }
      }
    };

    loadPdfPreview();

    return () => {
      isPdfLoadCancelled = true;
      setPdfPreviewUrl((currentPdfPreviewUrl) => {
        if (currentPdfPreviewUrl) {
          URL.revokeObjectURL(currentPdfPreviewUrl);
        }
        return null;
      });
    };
  }, [pdfResultPath, documentStatus, documentId]);

  return { pdfPreviewUrl };
}
