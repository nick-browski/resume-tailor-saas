import type { ResumeData } from "@/shared/api/types";

interface ResumeDiffProps {
  original: ResumeData;
  tailored: ResumeData;
}

type ExperienceEntry = ResumeData["experience"][number];
type EducationEntry = ResumeData["education"][number];
type CertificationEntry = NonNullable<ResumeData["certifications"]>[number];

type PairedItems<T> = {
  matched: Array<{ original: T | null; tailored: T }>;
  removed: T[];
};

type BulletDiff = {
  added: string[];
  removed: string[];
  unchanged: string[];
};

const PLACEHOLDERS = {
  empty: "—",
} as const;

const LABELS = {
  personalInfo: "Personal Information",
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
} as const;

const renderChangedValue = (originalValue: string, updatedValue: string) => {
  if (originalValue !== updatedValue) {
    return (
      <span className="bg-yellow-100 break-words">
        {originalValue || PLACEHOLDERS.empty} → {updatedValue || PLACEHOLDERS.empty}
      </span>
    );
  }

  return <span className="break-words">{updatedValue || PLACEHOLDERS.empty}</span>;
};

const renderWordDiff = (originalText: string, updatedText: string) => {
  const updatedWords = updatedText.split(/\s+/);
  const originalWords = originalText.split(/\s+/);
  const originalWordsSet = new Set(originalWords.map((word) => word.toLowerCase()));

  return updatedWords.map((word, index) => {
    const isNewWord = !originalWordsSet.has(word.toLowerCase());
    return (
      <span
        key={index}
        className={`${isNewWord ? "bg-green-200 font-medium" : ""} break-words`}
      >
        {word}{" "}
      </span>
    );
  });
};

const diffArrayByKey = <T,>(
  originalItems: T[],
  updatedItems: T[],
  getKey: (item: T) => string = (item) => String(item).toLowerCase()
) => {
  const originalKeys = new Set(originalItems.map(getKey));
  const updatedKeys = new Set(updatedItems.map(getKey));

  return {
    added: updatedItems.filter((item) => !originalKeys.has(getKey(item))),
    removed: originalItems.filter((item) => !updatedKeys.has(getKey(item))),
    unchanged: updatedItems.filter((item) => originalKeys.has(getKey(item))),
  };
};

const pairItemsByKey = <T,>(
  originalItems: T[] = [],
  updatedItems: T[] = [],
  getKey: (item: T) => string
): PairedItems<T> => {
  const originalMap = new Map<string, T>();
  originalItems.forEach((item) => originalMap.set(getKey(item), item));

  const matched: Array<{ original: T | null; tailored: T }> = [];

  updatedItems.forEach((item) => {
    const itemKey = getKey(item);
    if (originalMap.has(itemKey)) {
      matched.push({ original: originalMap.get(itemKey) || null, tailored: item });
      originalMap.delete(itemKey);
    } else {
      matched.push({ original: null, tailored: item });
    }
  });

  return { matched, removed: Array.from(originalMap.values()) };
};

const diffBulletLines = (
  originalBullets: string[] = [],
  updatedBullets: string[] = []
): BulletDiff => {
  const added = updatedBullets.filter(
    (bullet) => !originalBullets.some((orig) => orig.toLowerCase() === bullet.toLowerCase())
  );
  const removed = originalBullets.filter(
    (bullet) => !updatedBullets.some((updated) => updated.toLowerCase() === bullet.toLowerCase())
  );
  const unchanged = updatedBullets.filter((bullet) =>
    originalBullets.some((orig) => orig.toLowerCase() === bullet.toLowerCase())
  );

  return { added, removed, unchanged };
};

const getExperienceKey = (experienceEntry: ExperienceEntry) =>
  `${experienceEntry.company.toLowerCase()}-${experienceEntry.position.toLowerCase()}-${experienceEntry.startDate.toLowerCase()}`;

const getEducationKey = (educationEntry: EducationEntry) =>
  `${educationEntry.institution.toLowerCase()}-${educationEntry.degree.toLowerCase()}-${educationEntry.graduationDate.toLowerCase()}`;

const getCertificationKey = (certificationEntry: CertificationEntry) =>
  `${certificationEntry.name.toLowerCase()}-${certificationEntry.issuer.toLowerCase()}`;

function PersonalInfoDiffSection({ original, tailored }: ResumeDiffProps) {
  return (
    <div className="border-b pb-3 sm:pb-4">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
        {LABELS.personalInfo}
      </h3>
      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
        <div className="break-words">
          <span className="font-medium">Name: </span>
          {renderChangedValue(
            original.personalInfo.fullName,
            tailored.personalInfo.fullName
          )}
        </div>
        <div className="break-words">
          <span className="font-medium">Email: </span>
          {renderChangedValue(
            original.personalInfo.email,
            tailored.personalInfo.email
          )}
        </div>
        <div className="break-words">
          <span className="font-medium">Phone: </span>
          {renderChangedValue(
            original.personalInfo.phone,
            tailored.personalInfo.phone
          )}
        </div>
        <div className="break-words">
          <span className="font-medium">Location: </span>
          {renderChangedValue(
            original.personalInfo.location,
            tailored.personalInfo.location
          )}
        </div>
        {(original.personalInfo.linkedIn || tailored.personalInfo.linkedIn) && (
          <div className="break-words">
            <span className="font-medium">LinkedIn: </span>
            {renderChangedValue(
              original.personalInfo.linkedIn || PLACEHOLDERS.empty,
              tailored.personalInfo.linkedIn || PLACEHOLDERS.empty
            )}
          </div>
        )}
        {(original.personalInfo.website || tailored.personalInfo.website) && (
          <div className="break-words">
            <span className="font-medium">Website: </span>
            {renderChangedValue(
              original.personalInfo.website || PLACEHOLDERS.empty,
              tailored.personalInfo.website || PLACEHOLDERS.empty
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryDiffSection({ original, tailored }: ResumeDiffProps) {
  return (
    <div className="border-b pb-3 sm:pb-4">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
        {LABELS.summary}
      </h3>
      <div className="text-xs sm:text-sm leading-relaxed break-words">
        {renderWordDiff(original.summary, tailored.summary)}
      </div>
    </div>
  );
}

function ExperienceDiffSection({
  experiencePairs,
}: {
  experiencePairs: PairedItems<ExperienceEntry>;
}) {
  return (
    <div className="border-b pb-3 sm:pb-4">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
        {LABELS.experience}
      </h3>
      <div className="space-y-3 sm:space-y-4">
        {experiencePairs.matched.map((pairedExperience, pairIndex) => {
          const updatedExperience = pairedExperience.tailored;
          const originalExperience = pairedExperience.original;
          const bulletDiff = diffBulletLines(
            originalExperience?.description,
            updatedExperience.description
          );

          return (
            <div
              key={`matched-${pairIndex}`}
              className="border-l-2 border-gray-200 pl-3 sm:pl-4"
            >
              <div className="font-medium text-sm sm:text-base break-words">
                {originalExperience ? (
                  renderChangedValue(
                    originalExperience.position,
                    updatedExperience.position
                  )
                ) : (
                  <span className="bg-green-50 rounded px-1.5 py-0.5">
                    {updatedExperience.position}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 break-words mt-1">
                <span className="block sm:inline">
                  {originalExperience ? (
                    renderChangedValue(
                      originalExperience.company,
                      updatedExperience.company
                    )
                  ) : (
                    <span className="bg-green-50 rounded px-1.5 py-0.5">
                      {updatedExperience.company}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline"> | </span>
                <span className="block sm:inline sm:ml-1">
                  {originalExperience ? (
                    renderChangedValue(
                      `${originalExperience.startDate} - ${originalExperience.endDate}`,
                      `${updatedExperience.startDate} - ${updatedExperience.endDate}`
                    )
                  ) : (
                    <span className="bg-green-50 rounded px-1.5 py-0.5">
                      {updatedExperience.startDate} - {updatedExperience.endDate}
                    </span>
                  )}
                </span>
              </div>
              <ul className="mt-2 sm:mt-2 space-y-1 text-xs sm:text-sm">
                {bulletDiff.unchanged.map((bulletText, bulletIndex) => {
                  const originalBullet =
                    originalExperience?.description.find(
                      (originalLine) =>
                        originalLine.toLowerCase() === bulletText.toLowerCase()
                    ) || "";
                  return (
                    <li
                      key={`unchanged-${bulletIndex}`}
                      className="flex items-start break-words"
                    >
                      <span className="mr-1.5 sm:mr-2 flex-shrink-0">•</span>
                      <span className="break-words">
                        {renderWordDiff(originalBullet, bulletText)}
                      </span>
                    </li>
                  );
                })}
                {bulletDiff.added.map((bulletText, bulletIndex) => (
                  <li
                    key={`added-${bulletIndex}`}
                    className="flex items-start break-words bg-green-50 rounded px-2 py-1"
                  >
                    <span className="mr-1.5 sm:mr-2 flex-shrink-0 text-green-600">
                      +
                    </span>
                    <span className="break-words">{renderWordDiff("", bulletText)}</span>
                  </li>
                ))}
                {bulletDiff.removed.map((bulletText, bulletIndex) => (
                  <li
                    key={`removed-${bulletIndex}`}
                    className="flex items-start break-words text-gray-400 line-through"
                  >
                    <span className="mr-1.5 sm:mr-2 flex-shrink-0">•</span>
                    <span className="break-words">{bulletText}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {experiencePairs.removed.map((removedExperience, removedIndex) => (
          <div
            key={`removed-${removedIndex}`}
            className="border-l-2 border-red-200 pl-3 sm:pl-4 opacity-60"
          >
            <div className="font-medium text-sm sm:text-base break-words text-gray-400 line-through">
              {removedExperience.position}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 break-words mt-1">
              <span className="block sm:inline">{removedExperience.company}</span>
              <span className="hidden sm:inline"> | </span>
              <span className="block sm:inline sm:ml-1">
                {removedExperience.startDate} - {removedExperience.endDate}
              </span>
            </div>
            <ul className="mt-2 sm:mt-2 space-y-1 text-xs sm:text-sm">
              {removedExperience.description.map((bulletText, bulletIndex) => (
                <li
                  key={bulletIndex}
                  className="flex items-start break-words text-gray-400 line-through"
                >
                  <span className="mr-1.5 sm:mr-2 flex-shrink-0">•</span>
                  <span className="break-words">{bulletText}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function EducationDiffSection({
  educationPairs,
}: {
  educationPairs: PairedItems<EducationEntry>;
}) {
  return (
    <div className="border-b pb-3 sm:pb-4">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
        {LABELS.education}
      </h3>
      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
        {educationPairs.matched.map((pairedEducation, pairIndex) => {
          const updatedEducation = pairedEducation.tailored;
          const originalEducation = pairedEducation.original;
          const isNewEducation = !originalEducation;

          return (
            <div
              key={`matched-${pairIndex}`}
              className={`break-words ${
                isNewEducation ? "bg-green-50 rounded px-2 py-1.5" : ""
              }`}
            >
              <span className="font-medium">
                {originalEducation
                  ? renderChangedValue(originalEducation.degree, updatedEducation.degree)
                  : updatedEducation.degree}
              </span>
              {(updatedEducation.field || originalEducation?.field) && (
                <span>
                  {" "}
                  in{" "}
                  {originalEducation
                    ? renderChangedValue(
                        originalEducation.field || PLACEHOLDERS.empty,
                        updatedEducation.field || PLACEHOLDERS.empty
                      )
                    : updatedEducation.field || PLACEHOLDERS.empty}
                </span>
              )}
              <span className="text-gray-600 block sm:inline sm:ml-1">
                {" "}
                -{" "}
                {originalEducation
                  ? renderChangedValue(
                      originalEducation.institution,
                      updatedEducation.institution
                    )
                  : updatedEducation.institution}{" "}
                (
                {originalEducation
                  ? renderChangedValue(
                      originalEducation.graduationDate,
                      updatedEducation.graduationDate
                    )
                  : updatedEducation.graduationDate}
                )
              </span>
            </div>
          );
        })}

        {educationPairs.removed.map((removedEducation, removedIndex) => (
          <div
            key={`removed-${removedIndex}`}
            className="break-words text-gray-400 line-through"
          >
            <span className="font-medium">{removedEducation.degree}</span>
            {removedEducation.field && <span> in {removedEducation.field}</span>}
            <span className="text-gray-400 block sm:inline sm:ml-1">
              {" "}
              - {removedEducation.institution} ({removedEducation.graduationDate})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsDiffSection({ original, tailored }: ResumeDiffProps) {
  const skillDiff = diffArrayByKey(
    original.skills || [],
    tailored.skills || []
  );

  return (
    <div className="border-b pb-3 sm:pb-4">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
        {LABELS.skills}
      </h3>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {skillDiff.unchanged.map((skillName, skillIndex) => (
          <span
            key={skillIndex}
            className="px-2 sm:px-3 py-1 bg-gray-100 rounded-md text-xs sm:text-sm break-words"
          >
            {skillName}
          </span>
        ))}
        {skillDiff.added.map((skillName, skillIndex) => (
          <span
            key={`added-${skillIndex}`}
            className="px-2 sm:px-3 py-1 bg-green-200 rounded-md text-xs sm:text-sm font-medium break-words"
          >
            {skillName} <span className="hidden sm:inline">(new)</span>
            <span className="sm:hidden">+</span>
          </span>
        ))}
        {skillDiff.removed.map((skillName, skillIndex) => (
          <span
            key={`removed-${skillIndex}`}
            className="px-2 sm:px-3 py-1 bg-red-50 text-red-500 rounded-md text-xs sm:text-sm line-through break-words"
          >
            {skillName}
          </span>
        ))}
      </div>
    </div>
  );
}

function CertificationsDiffSection({
  certificationPairs,
}: {
  certificationPairs: PairedItems<CertificationEntry>;
}) {
  const hasCertifications =
    certificationPairs.matched.length > 0 || certificationPairs.removed.length > 0;

  if (!hasCertifications) {
    return null;
  }

  return (
    <div className="border-b pb-3 sm:pb-4">
      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
        {LABELS.certifications}
      </h3>
      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
        {certificationPairs.matched.map((pairedCertification, pairIndex) => {
          const updatedCertification = pairedCertification.tailored;
          const originalCertification = pairedCertification.original;

          if (!originalCertification) {
            return (
              <div
                key={`added-${pairIndex}`}
                className="break-words bg-green-200 rounded px-2 py-1.5 sm:px-2 sm:py-1"
              >
                <div className="flex flex-row flex-wrap sm:items-baseline sm:justify-between items-baseline gap-0.5 sm:gap-1">
                  <div className="flex flex-row flex-wrap items-baseline gap-0.5 sm:gap-1">
                    <span className="font-medium text-xs sm:text-sm">
                      {updatedCertification.name}
                    </span>
                    <span className="text-gray-600 text-xs sm:text-sm">
                      - {updatedCertification.issuer}
                    </span>
                    {updatedCertification.date ? (
                      <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                        ({updatedCertification.date})
                        <span className="text-green-700 font-medium ml-1 sm:hidden">
                          +
                        </span>
                      </span>
                    ) : (
                      <span className="text-green-700 font-medium text-xs sm:text-sm sm:hidden whitespace-nowrap ml-1">
                        +
                      </span>
                    )}
                  </div>
                  <span className="text-green-700 font-medium text-xs sm:text-sm sm:ml-auto hidden sm:inline whitespace-nowrap">
                    (new)
                  </span>
                </div>
              </div>
            );
          }

          const dateChanged = originalCertification.date !== updatedCertification.date;

          return (
            <div key={`cert-${pairIndex}`} className="break-words">
              <div className="flex flex-row flex-wrap items-baseline gap-0.5 sm:gap-1">
                <span className="font-medium text-xs sm:text-sm">
                  {updatedCertification.name}
                </span>
                <span className="text-gray-600 text-xs sm:text-sm">
                  - {updatedCertification.issuer}
                </span>
                {dateChanged ? (
                  <span className="bg-yellow-100 text-xs sm:text-sm">
                    ({originalCertification.date || PLACEHOLDERS.empty} → {updatedCertification.date || PLACEHOLDERS.empty})
                  </span>
                ) : (
                  updatedCertification.date && (
                    <span className="text-gray-600 text-xs sm:text-sm">
                      ({updatedCertification.date})
                    </span>
                  )
                )}
              </div>
            </div>
          );
        })}

        {certificationPairs.removed.map((removedCertification, removedIndex) => (
          <div
            key={`removed-${removedIndex}`}
            className="break-words text-gray-400 line-through"
          >
            <div className="flex flex-row flex-wrap items-baseline gap-0.5 sm:gap-1">
              <span className="font-medium text-xs sm:text-sm">
                {removedCertification.name}
              </span>
              <span className="text-xs sm:text-sm">- {removedCertification.issuer}</span>
              {removedCertification.date && (
                <span className="text-xs sm:text-sm">({removedCertification.date})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResumeDiff({ original, tailored }: ResumeDiffProps) {
  const experiencePairs = pairItemsByKey<ExperienceEntry>(
    original.experience || [],
    tailored.experience || [],
    getExperienceKey
  );

  const educationPairs = pairItemsByKey<EducationEntry>(
    original.education || [],
    tailored.education || [],
    getEducationKey
  );

  const certificationPairs = pairItemsByKey<CertificationEntry>(
    original.certifications || [],
    tailored.certifications || [],
    getCertificationKey
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PersonalInfoDiffSection original={original} tailored={tailored} />
      <SummaryDiffSection original={original} tailored={tailored} />
      <ExperienceDiffSection experiencePairs={experiencePairs} />
      <EducationDiffSection educationPairs={educationPairs} />
      <SkillsDiffSection original={original} tailored={tailored} />
      <CertificationsDiffSection certificationPairs={certificationPairs} />
    </div>
  );
}
