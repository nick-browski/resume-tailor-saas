import { UI_TEXT } from "@/shared/lib/constants";
import { useWizardStore } from "../../model/wizardStore";

export function PreviewHeader() {
  const selectedScenario = useWizardStore((state) => state.selectedScenario);
  const title =
    selectedScenario === "edit"
      ? UI_TEXT.PREVIEW_STEP_TITLE_EDIT
      : UI_TEXT.PREVIEW_STEP_TITLE_TAILOR;

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2">
        {title}
      </h2>
      <p className="text-sm sm:text-base text-gray-600">
        {UI_TEXT.PREVIEW_STEP_DESCRIPTION}
      </p>
    </div>
  );
}

