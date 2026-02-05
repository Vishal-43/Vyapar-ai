/**
 * Enterprise UI layout constants and utilities.
 * Ensures consistent spacing, sizing, and visual hierarchy across all pages.
 */

export const layoutConstants = {
  // Spacing
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "2.5rem", // 40px
    "3xl": "3rem", // 48px
  },

  // Page padding
  pagePadding: "px-4 pt-28 pb-20",
  pageMaxWidth: "max-w-6xl mx-auto",

  // Header sizing
  headerHeight: "h-16",
  sidebarWidth: "w-64",
  sidebarWidthCollapsed: "w-20",

  // Border radius
  borderRadius: {
    sm: "rounded",
    md: "rounded-lg",
    lg: "rounded-xl",
    full: "rounded-full",
  },

  // Border colors
  borderColor: {
    light: "border-gray-200 dark:border-gray-800",
    medium: "border-gray-300 dark:border-gray-700",
    dark: "border-gray-400 dark:border-gray-600",
  },

  // Background colors
  backgroundColor: {
    light: "bg-gray-50 dark:bg-gray-950",
    medium: "bg-gray-100 dark:bg-gray-900",
    card: "bg-white dark:bg-gray-950",
  },

  // Text colors
  textColor: {
    primary: "text-gray-900 dark:text-white",
    secondary: "text-gray-600 dark:text-gray-400",
    tertiary: "text-gray-500 dark:text-gray-500",
  },

  // Shadows
  shadow: {
    sm: "shadow-sm",
    md: "shadow",
    lg: "shadow-lg",
  },

  // Transitions
  transition: {
    fast: "transition-all duration-100",
    normal: "transition-all duration-200",
    slow: "transition-all duration-300",
  },

  // Z-index
  zIndex: {
    base: "z-0",
    dropdown: "z-10",
    fixed: "z-20",
    modal: "z-30",
    notification: "z-40",
    tooltip: "z-50",
  },
};

/**
 * Tailwind class helpers for common UI patterns.
 */
export const uiClasses = {
  // Page wrapper
  pageWrapper: `min-h-screen ${layoutConstants.backgroundColor.light} ${layoutConstants.textColor.primary}`,

  // Main content
  mainContent: `relative ${layoutConstants.zIndex.base} ${layoutConstants.pageMaxWidth} ${layoutConstants.pagePadding}`,

  // Card/Box
  card: `rounded-xl border ${layoutConstants.borderColor.light} ${layoutConstants.backgroundColor.card} p-6 ${layoutConstants.shadow.sm}`,

  // Button primary
  buttonPrimary: `px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 ${layoutConstants.transition.normal}`,

  // Button secondary
  buttonSecondary: `px-4 py-2 rounded-lg border ${layoutConstants.borderColor.light} ${layoutConstants.textColor.primary} hover:${layoutConstants.backgroundColor.medium} ${layoutConstants.transition.normal}`,

  // Input
  input: `w-full px-3 py-2 border ${layoutConstants.borderColor.light} rounded-lg ${layoutConstants.backgroundColor.card} ${layoutConstants.textColor.primary} focus:outline-none focus:ring-2 focus:ring-emerald-500`,

  // Section title
  sectionTitle: `text-2xl font-bold ${layoutConstants.textColor.primary} mb-6`,

  // Loading spinner
  spinnerSmall: `h-4 w-4 animate-spin border-2 border-emerald-600 border-transparent border-t-emerald-600`,
  spinnerMedium: `h-8 w-8 animate-spin border-3 border-emerald-600 border-transparent border-t-emerald-600`,
  spinnerLarge: `h-12 w-12 animate-spin border-4 border-emerald-600 border-transparent border-t-emerald-600`,

  // Empty state
  emptyState: `text-center py-16 ${layoutConstants.backgroundColor.light} rounded-lg border border-dashed ${layoutConstants.borderColor.light}`,
};
