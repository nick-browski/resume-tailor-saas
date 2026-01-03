import { useMobilePdfScale } from "../../../hooks/useMobilePdfScale";

interface PdfPreviewProps {
  pdfPreviewUrl: string;
}

// Displays PDF preview with mobile and desktop optimizations
export function PdfPreview({ pdfPreviewUrl }: PdfPreviewProps) {
  const { isMobile, mobileScale } = useMobilePdfScale();

  return (
    <div className="flex justify-center -mx-4 sm:mx-0">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-100 p-2 sm:p-4 md:p-6 rounded-lg shadow-sm">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="relative bg-white">
              <div className="h-1 bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
              <div
                className="relative overflow-auto"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                {isMobile ? (
                  <div
                    style={{
                      width: "100%",
                      height: "50vh",
                      minHeight: "400px",
                      overflow: "auto",
                      WebkitOverflowScrolling: "touch",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        transform: `scale(${mobileScale})`,
                        transformOrigin: "top left",
                        width: `${100 / mobileScale}%`,
                        height: `${100 / mobileScale}%`,
                      }}
                    >
                      <object
                        data={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitV`}
                        type="application/pdf"
                        className="border-0"
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          minHeight: "400px",
                        }}
                        aria-label="Resume Preview"
                      >
                        <p className="p-4 text-sm text-gray-600">
                          Your browser does not support PDFs.{" "}
                          <a
                            href={pdfPreviewUrl || ""}
                            download
                            className="text-blue-600 hover:underline"
                          >
                            Download the PDF
                          </a>
                          .
                        </p>
                      </object>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width`}
                    className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[800px] border-0"
                    title="Resume Preview"
                    style={{
                      display: "block",
                      minHeight: "400px",
                      width: "100%",
                      maxWidth: "100%",
                      WebkitOverflowScrolling: "touch",
                    }}
                    allow="fullscreen"
                    scrolling="yes"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-50 via-gray-50 to-blue-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

