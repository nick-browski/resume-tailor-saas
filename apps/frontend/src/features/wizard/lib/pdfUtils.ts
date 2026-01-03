import { PDFDocument } from "pdf-lib";
import { UI_TEXT } from "@/shared/lib/constants";

export async function getPdfPageCount(pdfFile: File): Promise<number> {
  try {
    const pdfArrayBuffer = await pdfFile.arrayBuffer();
    const pdfDocument = await PDFDocument.load(pdfArrayBuffer);
    return pdfDocument.getPageCount();
  } catch (pdfReadError) {
    throw new Error(UI_TEXT.FAILED_TO_READ_PDF_MESSAGE);
  }
}
