// PDF loading skeleton matching resume structure: header, summary, experience, education, skills
const SUMMARY_LINES = [100, 98, 85, 92]; // Summary section
const EXPERIENCE_BULLETS = [90, 88, 85, 82]; // Bullet points in experience
const SKILL_TAG_WIDTHS = [18, 22, 20, 19, 25, 18, 20, 24, 19, 21]; // Skill tags

export function PdfSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100">
      <div className="h-full flex flex-col gap-4 sm:gap-5 p-4 sm:p-6">
        {/* Header: Name, Email, Phone */}
        <div className="flex flex-col gap-2 sm:gap-2.5">
          <div className="h-6 sm:h-7 skeleton-shimmer rounded" style={{ width: "95%" }} />
          <div className="h-3.5 sm:h-4 skeleton-shimmer rounded" style={{ width: "60%" }} />
          <div className="h-3.5 sm:h-4 skeleton-shimmer rounded" style={{ width: "55%" }} />
        </div>

        {/* Summary Section */}
        <div className="flex flex-col gap-2.5 sm:gap-3 mt-1 sm:mt-2">
          <div className="h-4 sm:h-5 skeleton-shimmer rounded font-semibold" style={{ width: "25%" }} />
          {SUMMARY_LINES.map((width, i) => (
            <div
              key={`summary-${i}`}
              className="h-3 sm:h-3.5 skeleton-shimmer rounded"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>

        {/* Experience Section */}
        <div className="flex flex-col gap-3 sm:gap-4 mt-1 sm:mt-2">
          <div className="h-4 sm:h-5 skeleton-shimmer rounded font-semibold" style={{ width: "30%" }} />
          
          {/* Experience Item 1 */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="h-4 sm:h-4.5 skeleton-shimmer rounded" style={{ width: "70%" }} />
            <div className="h-3 sm:h-3.5 skeleton-shimmer rounded" style={{ width: "45%" }} />
            {EXPERIENCE_BULLETS.map((width, i) => (
              <div
                key={`exp1-${i}`}
                className="h-3 sm:h-3.5 skeleton-shimmer rounded ml-4 sm:ml-5"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>

          {/* Experience Item 2 */}
          <div className="flex flex-col gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            <div className="h-4 sm:h-4.5 skeleton-shimmer rounded" style={{ width: "65%" }} />
            <div className="h-3 sm:h-3.5 skeleton-shimmer rounded" style={{ width: "50%" }} />
            {EXPERIENCE_BULLETS.slice(0, 3).map((width, i) => (
              <div
                key={`exp2-${i}`}
                className="h-3 sm:h-3.5 skeleton-shimmer rounded ml-4 sm:ml-5"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </div>

        {/* Education Section */}
        <div className="flex flex-col gap-2 sm:gap-2.5 mt-1 sm:mt-2">
          <div className="h-4 sm:h-5 skeleton-shimmer rounded font-semibold" style={{ width: "28%" }} />
          <div className="h-3 sm:h-3.5 skeleton-shimmer rounded" style={{ width: "75%" }} />
          <div className="h-3 sm:h-3.5 skeleton-shimmer rounded" style={{ width: "60%" }} />
        </div>

        {/* Skills Section */}
        <div className="flex flex-col gap-2.5 sm:gap-3 mt-1 sm:mt-2">
          <div className="h-4 sm:h-5 skeleton-shimmer rounded font-semibold" style={{ width: "20%" }} />
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {SKILL_TAG_WIDTHS.map((width, i) => (
              <div
                key={`skill-${i}`}
                className="h-5 sm:h-6 skeleton-shimmer rounded"
                style={{ width: `${width}%`, minWidth: "60px" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
