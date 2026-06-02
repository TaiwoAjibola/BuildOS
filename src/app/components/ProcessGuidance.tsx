import { AlertCircle, ArrowRight, CheckCircle, Clock, User } from "lucide-react";

export interface WorkflowStep {
  id: string;
  label: string;
  status: "completed" | "current" | "pending";
  responsible?: string;
  dueDate?: string;
}

interface ProcessGuidanceProps {
  title: string;
  steps: WorkflowStep[];
  currentStatus: string;
  nextStep: string;
  responsible?: string;
  dueDate?: string;
  variant?: "default" | "compact";
}

export function ProcessGuidance({ title, steps, currentStatus, nextStep, responsible, dueDate, variant = "default" }: ProcessGuidanceProps) {
  if (variant === "compact") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{title}</span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-700">{currentStatus}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {nextStep && (
              <span className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-orange-500" />
                Next: <strong className="text-gray-700">{nextStep}</strong>
              </span>
            )}
            {responsible && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {responsible}
              </span>
            )}
            {dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {dueDate}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">
          <AlertCircle className="w-3 h-3" /> {currentStatus}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={step.id} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.status === "completed" ? "bg-green-100 text-green-600" :
                  step.status === "current" ? "bg-orange-100 text-orange-600" :
                  "bg-gray-100 text-gray-300"
                }`}>
                  {step.status === "completed" ? <CheckCircle className="w-3.5 h-3.5" /> :
                   step.status === "current" ? <AlertCircle className="w-3.5 h-3.5" /> :
                   <span className="w-2 h-2 rounded-full bg-gray-300" />}
                </div>
                {!isLast && <div className="w-px flex-1 min-h-[8px] bg-gray-200" />}
              </div>
              <div className={`pb-2 text-xs ${step.status === "completed" ? "text-gray-400" : step.status === "current" ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
        {nextStep && (
          <span className="flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
            Next: <strong className="text-gray-700">{nextStep}</strong>
          </span>
        )}
        {responsible && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> <strong className="text-gray-700">{responsible}</strong>
          </span>
        )}
        {dueDate && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Due: <strong className="text-gray-700">{dueDate}</strong>
          </span>
        )}
      </div>
    </div>
  );
}