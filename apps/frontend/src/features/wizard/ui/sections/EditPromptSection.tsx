import { useCallback, forwardRef, useEffect, useState } from "react";
import {
  TEXTAREA_CONSTANTS,
  UI_TEXT,
  VALIDATION_CONSTANTS,
  ANIMATION_CONSTANTS,
} from "@/shared/lib/constants";
import { TourTarget } from "@/shared/ui";
import { validateEditPrompt } from "../../schemas";
import { ValidationHint } from "../validation";

interface EditPromptSectionProps {
  editPrompt: string;
  editPromptError: string | null;
  isEditing: boolean;
  hasAttemptedSubmit: boolean;
  onEditPromptChange: (value: string) => void;
  onEditPromptError: (error: string | null) => void;
}

export const EditPromptSection = forwardRef<
  HTMLDivElement,
  EditPromptSectionProps
>(function EditPromptSection(
  {
    editPrompt,
    editPromptError,
    isEditing,
    hasAttemptedSubmit,
    onEditPromptChange,
    onEditPromptError,
  },
  ref
) {
  const handleEditPromptChange = useCallback(
    (textAreaChangeEvent: React.ChangeEvent<HTMLTextAreaElement>) => {
      const editPromptValue = textAreaChangeEvent.target.value;
      onEditPromptChange(editPromptValue);
      if (hasAttemptedSubmit && editPromptValue.trim()) {
        const editPromptValidationResult = validateEditPrompt(editPromptValue);
        onEditPromptError(
          editPromptValidationResult.success
            ? null
            : editPromptValidationResult.error || null
        );
      } else {
        onEditPromptError(null);
      }
    },
    [hasAttemptedSubmit, onEditPromptChange, onEditPromptError]
  );

  const handleTemplateSelect = useCallback(
    (template: string) => {
      onEditPromptChange(template);
      if (hasAttemptedSubmit) {
        const editPromptValidationResult = validateEditPrompt(template);
        onEditPromptError(
          editPromptValidationResult.success
            ? null
            : editPromptValidationResult.error || null
        );
      }
    },
    [hasAttemptedSubmit, onEditPromptChange, onEditPromptError]
  );

  const [isSelectVisible, setIsSelectVisible] = useState(false);

  useEffect(() => {
    // Запускаем анимацию появления после монтирования
    const timer = setTimeout(() => {
      setIsSelectVisible(true);
    }, ANIMATION_CONSTANTS.SELECT_ENTER_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
        <label className="block text-sm font-semibold text-gray-900">
          {UI_TEXT.EDIT_INSTRUCTIONS_LABEL}
          <span className="ml-1.5 text-red-500 font-normal">*</span>
        </label>
        <div className="relative w-full sm:w-auto">
          <select
            onChange={(templateSelectEvent) => {
              if (templateSelectEvent.target.value) {
                handleTemplateSelect(templateSelectEvent.target.value);
              }
              templateSelectEvent.target.value = "";
            }}
            className={`w-full sm:w-auto text-sm px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:scale-[1.01] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:scale-[1.02] transition touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:focus:scale-100 ${
              isSelectVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1"
            }`}
            style={{
              transitionDuration: `${ANIMATION_CONSTANTS.SELECT_ENTER_DURATION_MS}ms`,
              transitionTimingFunction: ANIMATION_CONSTANTS.SELECT_EASING,
              willChange: "opacity, transform",
            }}
            disabled={isEditing}
          >
            <option value="" className="text-gray-500">
              {UI_TEXT.EDIT_PROMPT_TEMPLATES_PLACEHOLDER}
            </option>
            <option value={UI_TEXT.EDIT_PROMPT_TEMPLATES.CHANGE_CONTACT_INFO}>
              {UI_TEXT.EDIT_PROMPT_TEMPLATES.CHANGE_CONTACT_INFO}
            </option>
            <option value={UI_TEXT.EDIT_PROMPT_TEMPLATES.ADD_CERTIFICATION}>
              {UI_TEXT.EDIT_PROMPT_TEMPLATES.ADD_CERTIFICATION}
            </option>
            <option value={UI_TEXT.EDIT_PROMPT_TEMPLATES.UPDATE_EXPERIENCE}>
              {UI_TEXT.EDIT_PROMPT_TEMPLATES.UPDATE_EXPERIENCE}
            </option>
          </select>
        </div>
      </div>
      <TourTarget ref={ref}>
        <textarea
          value={editPrompt}
          onChange={handleEditPromptChange}
          rows={TEXTAREA_CONSTANTS.JOB_DESCRIPTION_ROWS}
          className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 transition-colors touch-manipulation ${
            hasAttemptedSubmit && editPromptError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
          placeholder={UI_TEXT.EDIT_PROMPT_PLACEHOLDER}
          disabled={isEditing}
          required
        />
      </TourTarget>
      <ValidationHint
        hasAttemptedSubmit={hasAttemptedSubmit}
        validationError={editPromptError}
        hintText={UI_TEXT.EDIT_PROMPT_VALIDATION_HINT(
          VALIDATION_CONSTANTS.EDIT_PROMPT_MIN_LENGTH,
          VALIDATION_CONSTANTS.EDIT_PROMPT_MAX_LENGTH
        )}
        currentLength={editPrompt ? editPrompt.length : undefined}
        maxLength={VALIDATION_CONSTANTS.EDIT_PROMPT_MAX_LENGTH}
      />
    </div>
  );
});
