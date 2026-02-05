export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  icon,
}: {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="
        glass-card
        p-6
        flex items-start justify-between
        rounded-none

        transition-all duration-200
        hover:-translate-y-[1px]
        hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]
      "
    >
      {}
      <div className="space-y-2">
        {}
        <p className="text-sm font-medium text-soft">
          {title}
        </p>

        {}
        <div className="flex items-end gap-1">
          <span className="text-3xl font-semibold text-[rgb(var(--emerald-main))]">
            {value}
          </span>
          {unit && (
            <span className="text-base font-medium text-soft">
              {unit}
            </span>
          )}
        </div>

        {}
        {subtitle && (
          <p className="text-sm text-soft">
            {subtitle}
          </p>
        )}
      </div>

      {}
      {icon && (
        <div className="text-[rgb(var(--emerald-main))]">
          {icon}
        </div>
      )}
    </div>
  );
}
