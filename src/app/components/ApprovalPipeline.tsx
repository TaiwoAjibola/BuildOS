import { CheckCircle2, X, Clock } from "lucide-react";

export interface PipelineStep {
  label: string;
  actor?: string;
  status: "completed" | "active" | "pending" | "rejected";
  date?: string;
  note?: string;
}

interface ApprovalPipelineProps {
  steps: PipelineStep[];
  /** Tailwind bg+border classes for the active step circle, e.g. "bg-teal-600 border-teal-600" */
  accentClass?: string;
  /** Tailwind text class for the active step label, e.g. "text-teal-700" */
  accentTextClass?: string;
}

export function ApprovalPipeline({
  steps,
  accentClass     = "bg-teal-600 border-teal-600",
  accentTextClass = "text-teal-700",
}: ApprovalPipelineProps) {
  const pendingCount    = steps.filter(s => s.status === "pending").length;
  const activeStep      = steps.find(s => s.status === "active");
  const isRejected      = steps.some(s => s.status === "rejected");
  const isFullyApproved = steps.length > 0 && steps.every(s => s.status === "completed");

  return (
    <div className="space-y-3">
      {/* Pipeline track */}
      <div className="flex items-start">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 flex flex-col items-center min-w-0">
            {/* Circle + connector */}
            <div className="flex items-center w-full">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 text-xs font-bold transition-colors ${
                step.status === "completed" ? "bg-green-500 border-green-500 text-white" :
                step.status === "active"    ? `${accentClass} text-white` :
                step.status === "rejected"  ? "bg-red-500 border-red-500 text-white" :
                                             "bg-white border-gray-300 text-gray-400"
              }`}>
                {step.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> :
                 step.status === "rejected"  ? <X className="w-4 h-4" /> :
                 step.status === "active"    ? <Clock className="w-3.5 h-3.5" /> :
                 <span>{i + 1}</span>}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 transition-colors ${step.status === "completed" ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
            {/* Label */}
            <div className="mt-2 text-center px-0.5 w-full">
              <p className={`text-xs font-medium leading-tight truncate ${
                step.status === "active"    ? accentTextClass :
                step.status === "completed" ? "text-gray-700" :
                step.status === "rejected"  ? "text-red-600" :
                "text-gray-400"
              }`}>{step.label}</p>
              {step.actor && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{step.actor}</p>}
              {step.date  && <p className="text-[10px] text-gray-400 truncate">{step.date}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-3 flex-wrap">
        {isFullyApproved ? (
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" /> Fully approved
          </span>
        ) : isRejected ? (
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 text-xs font-medium">
            <X className="w-3 h-3" /> Request rejected
          </span>
        ) : activeStep ? (
          <>
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium">
              <Clock className="w-3 h-3" />
              Awaiting <strong className="ml-0.5">{activeStep.actor}</strong>
            </span>
            {pendingCount > 0 && (
              <span className="text-xs text-gray-400">{pendingCount} more stage{pendingCount > 1 ? "s" : ""} after this</span>
            )}
          </>
        ) : null}
      </div>

      {/* Per-step notes */}
      {steps.some(s => s.note) && (
        <div className="space-y-1.5 pt-1">
          {steps.filter(s => s.note).map((s, i) => (
            <div key={i} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600">
              <span className="font-medium text-gray-500 flex-shrink-0 whitespace-nowrap">{s.actor ?? s.label}:</span>
              <span className="italic">"{s.note}"</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
