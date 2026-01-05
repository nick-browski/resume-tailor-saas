// PDF loading skeleton with fixed widths for hydration safety
const LINE_WIDTHS = [88, 92, 85, 90, 87, 93, 89, 91];
const BOTTOM_LINE_WIDTHS = [82, 88, 75, 90, 85, 87];

export function PdfSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100">
      <div className="h-full flex flex-col gap-3 sm:gap-4 p-3 sm:p-6">
        {/* Simulated PDF page lines */}
        {LINE_WIDTHS.map((width, i) => (
          <div
            key={i}
            className="h-3 sm:h-4 skeleton-shimmer rounded"
            style={{
              width: `${width}%`,
              marginLeft: i % 2 === 0 ? "0" : "5%",
            }}
          />
        ))}
        {/* Simulated PDF page blocks */}
        <div className="flex gap-2 sm:gap-4 mt-2 sm:mt-4">
          <div className="flex-1 h-24 sm:h-32 skeleton-shimmer rounded" />
          <div className="flex-1 h-24 sm:h-32 skeleton-shimmer rounded" />
        </div>
        {BOTTOM_LINE_WIDTHS.map((width, i) => (
          <div
            key={`line-${i}`}
            className="h-2.5 sm:h-3 skeleton-shimmer rounded"
            style={{
              width: `${width}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
