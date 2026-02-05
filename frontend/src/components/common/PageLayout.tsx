import React from "react";
import { uiClasses } from "../../libs/layoutConstants";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

/**
 * Standard page layout wrapper.
 * Ensures consistent spacing, sizing, and visual hierarchy across all pages.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
}) => {
  return (
    <div className={uiClasses.pageWrapper}>
      <main className={uiClasses.mainContent}>
        {}
        {(title || subtitle || breadcrumbs || actions) && (
          <div className="mb-8">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {breadcrumbs.map((item, idx) => (
                  <span key={idx}>
                    {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
                    {idx < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div>
                {title && <h1 className="text-4xl font-bold mb-2">{title}</h1>}
                {subtitle && (
                  <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
                )}
              </div>

              {actions && <div className="flex gap-3">{actions}</div>}
            </div>
          </div>
        )}

        {}
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
