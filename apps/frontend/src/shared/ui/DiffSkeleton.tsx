// Skeleton component for ResumeDiff loading state
export function DiffSkeleton() {
  return (
    <div className="border border-gray-300 rounded-md p-3 sm:p-4 md:p-6 bg-white overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        {/* Personal Info skeleton */}
        <div className="border-b pb-3 sm:pb-4">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-48 mb-3 sm:mb-4" />
          <div className="space-y-2 sm:space-y-2.5">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>

        {/* Summary skeleton */}
        <div className="border-b pb-3 sm:pb-4">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 mb-3 sm:mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-11/12" />
            <div className="h-4 bg-gray-200 rounded w-10/12" />
            <div className="h-4 bg-gray-200 rounded w-9/12" />
          </div>
        </div>

        {/* Experience skeleton */}
        <div className="border-b pb-3 sm:pb-4">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-40 mb-3 sm:mb-4" />
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        </div>

        {/* Education skeleton */}
        <div className="border-b pb-3 sm:pb-4">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-36 mb-3 sm:mb-4" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>

        {/* Skills skeleton */}
        <div>
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-28 mb-3 sm:mb-4" />
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded w-20 sm:w-24" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

