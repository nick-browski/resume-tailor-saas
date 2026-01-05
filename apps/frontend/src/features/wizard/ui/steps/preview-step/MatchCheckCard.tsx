import type { MatchCheckResult } from "@/shared/api/types";

interface MatchCheckCardProps {
  matchCheckResult: MatchCheckResult;
  variant: "success" | "error";
}

export function MatchCheckCard({
  matchCheckResult,
  variant,
}: MatchCheckCardProps) {
  const matchPercentage = Math.round(matchCheckResult.matchScore * 100);
  const isSuccessVariant = variant === "success";

  const borderColorClassName = isSuccessVariant
    ? "border-green-300"
    : "border-red-300";
  const backgroundColorClassName = isSuccessVariant
    ? "bg-green-50"
    : "bg-red-50";
  const iconBackgroundColorClassName = isSuccessVariant
    ? "bg-green-100"
    : "bg-red-100";
  const iconColorClassName = isSuccessVariant
    ? "text-green-600"
    : "text-red-600";
  const percentageColorClassName = isSuccessVariant
    ? "text-green-600"
    : "text-red-600";
  const bulletColorClassName = isSuccessVariant
    ? "text-green-600"
    : "text-red-600";

  const cardTitle = isSuccessVariant
    ? "Compatibility Match"
    : "Resume Doesn't Match Job Requirements";
  const cardDescription = isSuccessVariant
    ? `Your resume matches ${matchPercentage}% of the job requirements`
    : `Your resume matches only ${matchPercentage}% of the job requirements`;

  return (
    <div
      className={`border ${borderColorClassName} rounded-md p-4 sm:p-5 ${backgroundColorClassName}`}
    >
      <MatchCheckCardHeader
        title={cardTitle}
        description={cardDescription}
        percentage={matchPercentage}
        iconBgColor={iconBackgroundColorClassName}
        iconColor={iconColorClassName}
        percentageColor={percentageColorClassName}
        isSuccess={isSuccessVariant}
      />

      {matchCheckResult.matchingSkills &&
        matchCheckResult.matchingSkills.length > 0 && (
          <SkillsList
            skills={matchCheckResult.matchingSkills}
            title="Matching Skills:"
            variant="success"
          />
        )}

      {matchCheckResult.missingSkills &&
        matchCheckResult.missingSkills.length > 0 && (
          <SkillsList
            skills={matchCheckResult.missingSkills}
            title={
              isSuccessVariant
                ? "Missing Skills:"
                : "Missing Required Skills:"
            }
            variant={isSuccessVariant ? "warning" : "error"}
          />
        )}

      {matchCheckResult.reasons && matchCheckResult.reasons.length > 0 && (
        <ReasonsList
          reasons={matchCheckResult.reasons}
          title={isSuccessVariant ? "Analysis:" : "Why It Doesn't Match:"}
          bulletColor={bulletColorClassName}
        />
      )}
    </div>
  );
}

interface MatchCheckCardHeaderProps {
  title: string;
  description: string;
  percentage: number;
  iconBgColor: string;
  iconColor: string;
  percentageColor: string;
  isSuccess: boolean;
}

function MatchCheckCardHeader({
  title,
  description,
  percentage,
  iconBgColor,
  iconColor,
  percentageColor,
  isSuccess,
}: MatchCheckCardHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0">
        <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center`}>
          {isSuccess ? (
            <svg
              className={`w-6 h-6 ${iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className={`w-6 h-6 ${iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="text-right">
        <div className={`text-2xl sm:text-3xl font-bold ${percentageColor}`}>
          {percentage}%
        </div>
      </div>
    </div>
  );
}

interface SkillsListProps {
  skills: string[];
  title: string;
  variant: "success" | "warning" | "error";
}

function SkillsList({ skills, title, variant }: SkillsListProps) {
  const bgColorMap = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bgColorMap[variant]}`}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

interface ReasonsListProps {
  reasons: string[];
  title: string;
  bulletColor: string;
}

function ReasonsList({ reasons, title, bulletColor }: ReasonsListProps) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <ul className="space-y-1">
        {reasons.map((reason, index) => (
          <li key={`${reason}-${index}`} className="text-sm text-gray-600 flex items-start">
            <span className={`mr-2 ${bulletColor}`}>•</span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

