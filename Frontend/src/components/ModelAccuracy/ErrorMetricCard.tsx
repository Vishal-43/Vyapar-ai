interface Props {
  title: string;
  value: string;
  subtitle: string;
  traditional: string;
  improvement: string;
}

export default function ErrorMetricCard({
  title,
  value,
  subtitle,
  traditional,
  improvement,
}: Props) {
  return (
    <div className="border border-[var(--border)] bg-[rgba(var(--glass-white),0.65)] backdrop-blur-xl p-5">
      <p className="text-sm text-soft">{title}</p>

      <p className="text-2xl font-semibold text-emerald-600 mt-1">
        {value}
      </p>

      <p className="text-xs text-soft">{subtitle}</p>

      <div className="mt-3 flex justify-between text-xs">
        <span className="text-soft">Traditional: {traditional}</span>
        <span className="text-emerald-600">{improvement} better</span>
      </div>
    </div>
  );
}
