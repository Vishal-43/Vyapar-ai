/**
 * Sidebar navigation items configuration.
 * Organized by sections for better UX.
 */

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number | string;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  collapsible?: boolean;
}

/**
 * Navigation structure with sections.
 * This can be imported and used in the Navbar/Sidebar component.
 */
export const navigationSections: NavSection[] = [
  {
    id: "analytics",
    title: "Analytics",
    collapsible: false,
    items: [
      {
        id: "product-analysis",
        label: "Product Analysis",
        icon: null, // Will use FiBarChart2
        path: "/dashboard/product-analysis",
      },
      {
        id: "inventory",
        label: "Inventory",
        icon: null, // Will use FiBox
        path: "/dashboard/inventory",
      },
      {
        id: "insights",
        label: "Insights",
        icon: null, // Will use FiTrendingUp
        path: "/dashboard/insights",
      },
      {
        id: "model-accuracy",
        label: "Model Accuracy",
        icon: null, // Will use FiActivity
        path: "/dashboard/model-accuracy",
      },
    ],
  },
  {
    id: "actions",
    title: "Actions",
    collapsible: false,
    items: [
      {
        id: "buysell-alerts",
        label: "Buy/Sell Alerts",
        icon: null, // Will use FiZap
        path: "/dashboard/buysell-alerts",
      },
      {
        id: "recommendations",
        label: "Recommendations",
        icon: null, // Will use FiTarget
        path: "/dashboard/recommendations",
      },
      {
        id: "selling-strategy",
        label: "Selling Strategy",
        icon: null,
        path: "/dashboard/selling-strategy",
      },
      {
        id: "import-data",
        label: "Import Data",
        icon: null, // Will use FiUpload
        path: "/data/import",
      },
    ],
  },
  {
    id: "community",
    title: "Community",
    collapsible: false,
    items: [
      {
        id: "community",
        label: "Discussions",
        icon: null, // Will use MessageSquare
        path: "/dashboard/community",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    collapsible: false,
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: null, // Will use FiSettings
        path: "/dashboard/settings",
      },
    ],
  },
];

export default navigationSections;
