import { Layout } from "@/widgets/layout";
import {
  Wizard,
  UploadResumeStep,
  JobDescriptionStep,
  PreviewStep,
} from "@/features/wizard";
import { useWizardStore } from "@/features/wizard/model/wizardStore";
import { WIZARD_CONSTANTS } from "@/shared/lib/constants";

function App() {
  const { currentStep, nextStep, previousStep, reset } = useWizardStore();

  const renderCurrentStep = (): React.ReactNode => {
    switch (currentStep) {
      case WIZARD_CONSTANTS.FIRST_STEP:
        return <UploadResumeStep onNext={nextStep} />;
      case 2:
        return (
          <JobDescriptionStep onNext={nextStep} onPrevious={previousStep} />
        );
      case WIZARD_CONSTANTS.LAST_STEP:
        return <PreviewStep onPrevious={previousStep} onReset={reset} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Wizard
        currentStep={currentStep}
        totalSteps={WIZARD_CONSTANTS.TOTAL_STEPS}
      >
        {renderCurrentStep()}
      </Wizard>
    </Layout>
  );
}

export default App;
