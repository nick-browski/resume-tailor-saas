import type { MatchCheckResult } from "@/shared/api/types";
import { useState } from "react";

interface MatchCheckCardProps {
  matchCheckResult: MatchCheckResult;
  variant: "success" | "error";
}

export function MatchCheckCard({
  matchCheckResult,
  variant,
}: MatchCheckCardProps) {
  const [isReasonsOpen, setIsReasonsOpen] = useState(false);
  const matchPercentage = Math.round(matchCheckResult.matchScore * 100);
  const isSuccessVariant = variant === "success";

  // Clean, casual modern design
  const borderColorClassName = isSuccessVariant
    ? "border-green-200"
    : "border-red-200";
  const backgroundColorClassName = isSuccessVariant
    ? "bg-green-50/50"
    : "bg-red-50/50";
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
    ? "text-green-500"
    : "text-red-500";

  const cardTitle = isSuccessVariant
    ? "Compatibility Match"
    : "Resume Doesn't Match Job Requirements";
  const cardDescription = isSuccessVariant
    ? `Your resume matches ${matchPercentage}% of the job requirements`
    : `Your resume matches only ${matchPercentage}% of the job requirements`;

  return (
    <div
      className={`border ${borderColorClassName} rounded-lg p-4 sm:p-5 md:p-6 ${backgroundColorClassName} bg-white/50 shadow-sm`}
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
          isOpen={isReasonsOpen}
          onToggle={() => setIsReasonsOpen((prev) => !prev)}
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
    <div className="mb-4 sm:mb-5 md:mb-6">
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-3.5">
        <div className="flex-shrink-0 pt-0.5 sm:pt-1">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg ${iconBgColor} flex items-center justify-center shadow-sm`}
          >
            {isSuccess ? (
              <svg
                className={`w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 ${iconColor}`}
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
                className={`w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 ${iconColor}`}
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
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 break-words leading-snug">
                {title}
              </h3>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <div
                className={`text-2xl sm:text-3xl md:text-4xl font-bold ${percentageColor} leading-none tabular-nums`}
              >
                {percentage}%
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600 break-words leading-relaxed">
            {description}
          </p>
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
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
  };

  // Determine if skills should be displayed as tags (short) or list items (long)
  const shouldDisplayAsList = skills.some((skill) => skill.length > 50);

  if (shouldDisplayAsList) {
    // Display long skills as a bulleted list
    return (
      <div className="mt-4 sm:mt-5 md:mt-6">
        <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2.5 sm:mb-3">
          {title}
        </h4>
        <ul className="space-y-2 sm:space-y-2.5">
          {skills.map((skill, index) => (
            <li
              key={`${skill}-${index}`}
              className={`text-sm sm:text-base flex items-start ${
                variant === "success"
                  ? "text-green-700"
                  : variant === "warning"
                    ? "text-yellow-700"
                    : "text-red-700"
              }`}
            >
              <span
                className={`mr-2.5 flex-shrink-0 mt-0.5 ${
                  variant === "success"
                    ? "text-green-500"
                    : variant === "warning"
                      ? "text-yellow-500"
                      : "text-red-500"
                }`}
              >
                •
              </span>
              <span className="break-words leading-relaxed flex-1">{skill}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Display short skills as simple tags
  return (
    <div className="mt-4 sm:mt-5 md:mt-6">
      <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2.5 sm:mb-3">
        {title}
      </h4>
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className={`inline-flex items-center px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 md:py-2 rounded-md text-xs sm:text-sm font-medium ${bgColorMap[variant]} break-words shadow-sm`}
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
  isOpen: boolean;
  onToggle: () => void;
}

function ReasonsList({
  reasons,
  title,
  bulletColor,
  isOpen,
  onToggle,
}: ReasonsListProps) {
  return (
    <div className="mt-4 sm:mt-5 md:mt-6 border-t border-gray-100 pt-3 sm:pt-3.5">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-left group"
      >
        <div className="flex flex-col items-start">
          <h4 className="text-sm sm:text-base font-semibold text-gray-800">
            {title}
          </h4>
          <span className="mt-0.5 text-xs sm:text-[13px] text-gray-500">
            {isOpen ? "Hide explanation" : "Show explanation"}
          </span>
        </div>
        <span className="text-gray-400 group-hover:text-gray-500">
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul className="mt-2.5 sm:mt-3 space-y-2 sm:space-y-2.5 md:space-y-3">
          {reasons.map((reason, index) => (
            <li
              key={`${reason}-${index}`}
              className="text-sm sm:text-base text-gray-700 flex items-start"
            >
              <span
                className={`mr-2.5 flex-shrink-0 mt-0.5 ${bulletColor} text-lg leading-none`}
              >
                •
              </span>
              <span className="break-words flex-1 leading-relaxed">
                {reason}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

