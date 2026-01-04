// Skeleton component for PDF loading state
export function PdfSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100">
      <div className="h-full flex flex-col gap-4 p-6">
        {/* Simulated PDF page lines */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-4 skeleton-shimmer rounded"
            style={{
              width: `${85 + Math.random() * 10}%`,
              marginLeft: i % 2 === 0 ? "0" : "5%",
            }}
          />
        ))}
        {/* Simulated PDF page blocks */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 h-32 skeleton-shimmer rounded" />
          <div className="flex-1 h-32 skeleton-shimmer rounded" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div
            key={`line-${i}`}
            className="h-3 skeleton-shimmer rounded"
            style={{
              width: `${75 + Math.random() * 15}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
