import { useWizardStore } from "../model/wizardStore";
import { SCENARIO } from "@/shared/lib/constants";
import { InitialStep } from "../ui/InitialStep";
import { UploadResumeEditStep } from "../ui/UploadResumeEditStep";
import { EditPreviewStep } from "../ui/EditPreviewStep";
import { UploadResumeStep } from "../ui/UploadResumeStep";
import { JobDescriptionStep } from "../ui/JobDescriptionStep";
import { PreviewStep } from "../ui/preview-step/PreviewStep";

interface UseWizardStepRendererProps {
  onReset: () => void;
}

export function useWizardStepRenderer({ onReset }: UseWizardStepRendererProps) {
  const {
    currentStep,
    selectedScenario,
    nextStep,
    previousStep,
    setSelectedScenario,
    setStep,
  } = useWizardStore();

  const renderStep = () => {
    if (currentStep === 0 || !selectedScenario) {
      return (
        <InitialStep
          onSelectEdit={() => {
            setSelectedScenario(SCENARIO.EDIT);
            setStep(1);
          }}
          onSelectTailor={() => {
            setSelectedScenario(SCENARIO.TAILOR);
            setStep(1);
          }}
        />
      );
    }

    if (selectedScenario === SCENARIO.EDIT) {
      switch (currentStep) {
        case 1:
          return <UploadResumeEditStep onNext={nextStep} />;
        case 2:
          return <EditPreviewStep onPrevious={previousStep} onReset={onReset} />;
        default:
          return null;
      }
    }

    if (selectedScenario === SCENARIO.TAILOR) {
      switch (currentStep) {
        case 1:
          return <UploadResumeStep onNext={nextStep} />;
        case 2:
          return <JobDescriptionStep onPrevious={previousStep} />;
        case 3:
          return <PreviewStep onPrevious={previousStep} onReset={onReset} />;
        default:
          return null;
      }
    }

    return null;
  };

  return { renderStep };
}

