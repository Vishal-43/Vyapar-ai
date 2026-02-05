import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export type InsightPriority = "high" | "medium" | "info";

export interface InsightComponentProps {
  title: string;
  reason?: string;
  priority: InsightPriority;
  icon: React.ReactNode;
  confidence: number;
  timeHorizon: string;
}

const priorityStyles: Record<InsightPriority, string> = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-orange-500/10 text-orange-600",
  info: "bg-sky-500/10 text-sky-600",
};

export default function InsightComponent({
  title,
  reason,
  priority,
  icon,
  confidence,
  timeHorizon,
}: InsightComponentProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="
        border border-(--border)
        bg-[rgba(var(--glass-white),0.65)]
        backdrop-blur-xl
        transition
      "
    >
      {}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-5 flex items-center justify-between text-left"
      >
        <div className="flex items-start gap-4">
          <span className={`p-3 ${priorityStyles[priority]}`}>
            {icon}
          </span>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className={`${priorityStyles[priority]} px-2 py-0.5`}>
                {priority.toUpperCase()}
              </span>
              <span className="text-soft">
                {timeHorizon}
              </span>
            </div>

            <p className="text-lg font-semibold text-main">
              {title}
            </p>

            <p className="text-sm text-soft">
              Confidence: {confidence}%
            </p>
          </div>
        </div>

        <FiChevronDown
          className={`text-xl transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {}
      {open && reason && (
        <div className="px-5 pb-5 pt-4 border-t border-(--border)">
          <p className="text-sm uppercase tracking-wide text-soft mb-1">
            Explanation
          </p>
          <p className="text-base text-soft leading-relaxed">
            {reason}
          </p>
        </div>
      )}
    </div>
  );
}
