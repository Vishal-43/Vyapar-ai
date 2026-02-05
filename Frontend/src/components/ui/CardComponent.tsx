
export default function CardComponent({
  title,
  icon,
  children,
}: {
  title?: string | React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        glass-card
        p-6 sm:p-7
        flex flex-col
        space-y-4
        rounded-none

        transition-all duration-200 ease-out
        hover:-translate-y-[1px]
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]
        dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]
      "
    >
      {}
      {title && (
        <div className="flex items-center gap-2">
          {icon && (
            <span
              className="
                flex items-center
                text-[rgb(var(--emerald-main))]
              "
            >
              {icon}
            </span>
          )}

          {typeof title === 'string' ? (
            <h3
              className="
                text-lg sm:text-base
                font-semibold
                tracking-wide
                uppercase
                text-main
              "
            >
              {title}
            </h3>
          ) : (
            <div className="flex-1 text-lg sm:text-base font-semibold tracking-wide uppercase text-main">
              {title}
            </div>
          )}
        </div>
      )}

      {}
      <div
        className="h-px w-10"
        style={{ backgroundColor: "var(--border)" }}
      />

      {}
      <div
        className="
          text-base sm:text-lg
          font-medium
          text-main
        "
      >
        {children}
      </div>
    </div>
  );
}
