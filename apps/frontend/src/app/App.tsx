import { Layout } from "@/widgets/layout";
import {
  Wizard,
  UploadResumeStep,
  JobDescriptionStep,
  PreviewStep,
} from "@/features/wizard";
import { useWizardStore } from "@/features/wizard/model/wizardStore";

function App() {
  const { currentStep, nextStep, previousStep, reset } = useWizardStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UploadResumeStep onNext={nextStep} />;
      case 2:
        return (
          <JobDescriptionStep onNext={nextStep} onPrevious={previousStep} />
        );
      case 3:
        return <PreviewStep onPrevious={previousStep} onReset={reset} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Wizard currentStep={currentStep} totalSteps={3}>
        {renderStep()}
      </Wizard>
    </Layout>
  );
}

export default App;
