import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronRight, BarChart3, Box, TrendingUp, Activity, Zap, Target, Upload, Settings, Sparkles } from "lucide-react";
import { navigationSections } from "../../libs/navigationConfig";
import type { NavItem, NavSection } from "../../libs/navigationConfig";

const iconMap: Record<string, React.ReactNode> = {
  "product-analysis": <BarChart3 className="w-5 h-5" />,
  "inventory": <Box className="w-5 h-5" />,
  "insights": <TrendingUp className="w-5 h-5" />,
  "model-accuracy": <Activity className="w-5 h-5" />,
  "buysell-alerts": <Zap className="w-5 h-5" />,
  "recommendations": <Target className="w-5 h-5" />,
  "selling-strategy": <Sparkles className="w-5 h-5" />,
  "import-data": <Upload className="w-5 h-5" />,
  "settings": <Settings className="w-5 h-5" />,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemComponentProps {
  item: NavItem;
  onClick?: () => void;
  nested?: boolean;
}

interface SectionProps {
  section: NavSection;
  onItemClick?: () => void;
}

/**
 * NavItemComponent - Individual navigation item with active state
 */
const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  onClick,
  nested = false,
}) => (
  <NavLink
    to={item.path}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
      ${nested ? "ml-4" : ""}
      ${
        isActive
          ? "bg-emerald-600 dark:bg-emerald-700 text-white"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }
    `}
  >
    {iconMap[item.id] && <span className="text-base flex-shrink-0">{iconMap[item.id]}</span>}
    <span className="flex-1">{item.label}</span>
    {item.badge && (
      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
        {item.badge}
      </span>
    )}
  </NavLink>
);

/**
 * SectionComponent - Group of navigation items in a collapsible section
 */
const SectionComponent: React.FC<SectionProps> = ({
  section,
  onItemClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-1">
      {section.collapsible && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          {section.title}
        </button>
      )}

      {(!section.collapsible || isExpanded) && (
        <div className="space-y-1">
          {section.items.map((item: NavItem) => (
            <NavItemComponent
              key={item.id}
              item={item}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Sidebar - Enhanced navigation sidebar with section grouping
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 
          transform transition-transform duration-300 z-50 overflow-y-auto
          md:static md:transform-none md:z-10
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {}
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-800">
          <a href="/" className="flex items-center gap-2">
            <img src="/icon.png" className="h-8 w-8" alt="Vypaar AI" />
            <span className="font-semibold text-gray-900 dark:text-white">
              Vypaar AI
            </span>
          </a>
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            
          </button>
        </div>

        {}
        <nav className="space-y-6 p-4">
          {navigationSections.map((section: NavSection) => (
            <SectionComponent
              key={section.id}
              section={section}
              onItemClick={onClose}
            />
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
