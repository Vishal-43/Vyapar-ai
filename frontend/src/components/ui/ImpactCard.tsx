import {
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

export interface ImpactListItem {
  title: string;
  subtitle?: string;
  delta?: string;
  positive?: boolean;
}

interface ImpactListCardProps {
  title: string;
  icon?: React.ReactNode;
  items: ImpactListItem[];
}

function ImpactRow({
  title,
  subtitle,
  delta,
  positive = true,
}: ImpactListItem) {
  return (
    <div
      className="
        flex items-center justify-between
        px-4 py-3
        bg-[rgba(var(--glass-white),0.35)]
        dark:bg-[rgba(var(--glass-white),0.15)]
      "
    >
      {}
      <div>
        <p className="text-sm font-medium text-main">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-soft">
            {subtitle}
          </p>
        )}
      </div>

      {}
      {delta && (
        <div
          className="
            flex items-center gap-1
            text-sm font-semibold
          "
          style={{
            color: positive
              ? "rgb(var(--emerald-main))"
              : "#f59e0b",
          }}
        >
          {positive ? (
            <FiTrendingUp size={14} />
          ) : (
            <FiTrendingDown size={14} />
          )}
          {delta}
        </div>
      )}
    </div>
  );
}

export default function ImpactListCard({
  title,
  icon,
  items,
}: ImpactListCardProps) {
  return (
    <div
      className="
        glass-card
        p-5 sm:p-6
        rounded-none
        space-y-3
      "
    >
      {}
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-[rgb(var(--emerald-main))]">
            {icon}
          </span>
        )}
        <h3
          className="
            text-sm sm:text-base
            font-semibold
            tracking-wide
            uppercase
            text-main
          "
        >
          {title}
        </h3>
      </div>

      {}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <ImpactRow key={idx} {...item} />
        ))}
      </div>
    </div>
  );
}
