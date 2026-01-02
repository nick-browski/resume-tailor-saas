import type { ResumeData } from "@/shared/api/types";

interface ResumeDiffProps {
  original: ResumeData;
  tailored: ResumeData;
}

export function ResumeDiff({ original, tailored }: ResumeDiffProps) {
  const compareText = (originalText: string, tailoredText: string) => {
    const words = tailoredText.split(/\s+/);
    const originalWords = originalText.split(/\s+/);
    const originalSet = new Set(originalWords.map((w) => w.toLowerCase()));

    return words.map((word, index) => {
      const isNew = !originalSet.has(word.toLowerCase());
      return (
        <span
          key={index}
          className={`${isNew ? "bg-green-200 font-medium" : ""} break-words`}
        >
          {word}{" "}
        </span>
      );
    });
  };

  const compareArrays = (originalArray: string[], tailoredArray: string[]) => {
    const originalSet = new Set(
      originalArray.map((item) => item.toLowerCase())
    );
    const tailoredSet = new Set(
      tailoredArray.map((item) => item.toLowerCase())
    );

    const added = tailoredArray.filter(
      (item) => !originalSet.has(item.toLowerCase())
    );
    const removed = originalArray.filter(
      (item) => !tailoredSet.has(item.toLowerCase())
    );
    const unchanged = tailoredArray.filter((item) =>
      originalSet.has(item.toLowerCase())
    );

    return { added, removed, unchanged };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Personal Info */}
      <div className="border-b pb-3 sm:pb-4">
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
          Personal Information
        </h3>
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <div className="break-words">
            <span className="font-medium">Name: </span>
            {original.personalInfo.fullName !==
            tailored.personalInfo.fullName ? (
              <span className="bg-yellow-100 break-words">
                {original.personalInfo.fullName} →{" "}
                {tailored.personalInfo.fullName}
              </span>
            ) : (
              <span className="break-words">
                {tailored.personalInfo.fullName}
              </span>
            )}
          </div>
          <div className="break-words">
            <span className="font-medium">Email: </span>
            <span className="break-all">{tailored.personalInfo.email}</span>
          </div>
          <div className="break-words">
            <span className="font-medium">Phone: </span>
            {tailored.personalInfo.phone}
          </div>
          <div className="break-words">
            <span className="font-medium">Location: </span>
            {tailored.personalInfo.location}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-b pb-3 sm:pb-4">
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
          Summary
        </h3>
        <div className="text-xs sm:text-sm leading-relaxed break-words">
          {compareText(original.summary, tailored.summary)}
        </div>
      </div>

      {/* Experience */}
      <div className="border-b pb-3 sm:pb-4">
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
          Experience
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {tailored.experience.map((exp, index) => {
            const originalExp = original.experience[index];
            return (
              <div
                key={index}
                className="border-l-2 border-gray-200 pl-3 sm:pl-4"
              >
                <div className="font-medium text-sm sm:text-base break-words">
                  {exp.position}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 break-words mt-1">
                  <span className="block sm:inline">{exp.company}</span>
                  <span className="hidden sm:inline"> | </span>
                  <span className="block sm:inline sm:ml-1">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <ul className="mt-2 sm:mt-2 space-y-1 text-xs sm:text-sm">
                  {exp.description.map((desc, descIndex) => (
                    <li
                      key={descIndex}
                      className="flex items-start break-words"
                    >
                      <span className="mr-1.5 sm:mr-2 flex-shrink-0">•</span>
                      <span className="break-words">
                        {compareText(
                          originalExp?.description[descIndex] || "",
                          desc
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Education */}
      <div className="border-b pb-3 sm:pb-4">
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
          Education
        </h3>
        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          {tailored.education.map((edu, index) => (
            <div key={index} className="break-words">
              <span className="font-medium">{edu.degree}</span>
              {edu.field && <span> in {edu.field}</span>}
              <span className="text-gray-600 block sm:inline sm:ml-1">
                - {edu.institution} ({edu.graduationDate})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="border-b pb-3 sm:pb-4">
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
          Skills
        </h3>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(() => {
            const { added, unchanged } = compareArrays(
              original.skills,
              tailored.skills
            );
            return (
              <>
                {unchanged.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 sm:px-3 py-1 bg-gray-100 rounded-md text-xs sm:text-sm break-words"
                  >
                    {skill}
                  </span>
                ))}
                {added.map((skill, index) => (
                  <span
                    key={`added-${index}`}
                    className="px-2 sm:px-3 py-1 bg-green-200 rounded-md text-xs sm:text-sm font-medium break-words"
                  >
                    {skill} <span className="hidden sm:inline">(new)</span>
                    <span className="sm:hidden">+</span>
                  </span>
                ))}
              </>
            );
          })()}
        </div>
      </div>

      {/* Certifications */}
      {tailored.certifications && tailored.certifications.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
            Certifications
          </h3>
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            {tailored.certifications.map((cert, index) => (
              <div key={index} className="break-words">
                <span className="font-medium">{cert.name}</span>
                <span className="text-gray-600 block sm:inline sm:ml-1">
                  - {cert.issuer}
                </span>
                {cert.date && (
                  <span className="text-gray-600 block sm:inline sm:ml-1">
                    ({cert.date})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
