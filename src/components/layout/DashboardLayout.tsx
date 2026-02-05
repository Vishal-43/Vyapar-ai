import React from "react";
import { ErrorBoundary } from "../common/ErrorBoundary";
import Navbar from "../dashboard/Navbar/Navbar";
import UserSync from "../dashboard/Navbar/UserSync";
import GraphBackgroundCorner from "../Background/GraphBackgroundCorner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout - Main layout wrapper for authenticated dashboard pages
 * Provides consistent structure: Navbar, ErrorBoundary, and content
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  return (
    <ErrorBoundary>
      <div className="dashboard relative min-h-screen overflow-hidden">
        <GraphBackgroundCorner />
        <Navbar />
        <UserSync />
        <main className="dashboard-body relative z-10">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardLayout;
