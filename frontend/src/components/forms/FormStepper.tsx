import { cn } from '../../lib/utils';

interface Step {
  id: string;
  label: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol role="list" className="space-y-4 md:flex md:space-y-0 md:space-x-8">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={step.id} className="md:flex-1">
              <button
                type="button"
                onClick={() => onStepClick && onStepClick(index)}
                disabled={!onStepClick}
                className={cn(
                  'group flex w-full flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 text-left transition-colors',
                  isCompleted
                    ? 'border-primary hover:border-primary/80'
                    : isCurrent
                      ? 'border-primary'
                      : 'border-muted hover:border-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCompleted
                      ? 'text-primary group-hover:text-primary/80'
                      : isCurrent
                        ? 'text-primary'
                        : 'text-muted-foreground',
                  )}
                >
                  Step {index + 1}
                </span>
                <span className="text-sm font-medium text-foreground">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
