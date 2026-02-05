import { useState, type ReactNode } from "react";
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Layers,
  Cpu,
  Database,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import Navbar from "../components/landing/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface FeatureBlock {
  title: string;
  description: string;
}

interface ArchitectureBlock {
  name: string;
  role: string;
  description: string;
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedArch, setExpandedArch] = useState<string | null>(null);

  

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: <Brain size={16} /> },
    { id: "problem", label: "Problem Space", icon: <AlertTriangle size={16} /> },
    { id: "solution", label: "Solution Flow", icon: <CheckCircle2 size={16} /> },
    { id: "architecture", label: "Architecture", icon: <GitBranch size={16} /> },
    { id: "features", label: "Core Capabilities", icon: <Layers size={16} /> },
    { id: "ml", label: "ML System", icon: <Cpu size={16} /> },
    { id: "data", label: "Data Layer", icon: <Database size={16} /> },
    { id: "integration", label: "Integration", icon: <ArrowRight size={16} /> },
  ];

  

  const features: FeatureBlock[] = [
    {
      title: "Demand Forecasting",
      description:
        "Short-term demand prediction using historical sales, seasonality, weather signals, and event-based uplift detection.",
    },
    {
      title: "Inventory Intelligence",
      description:
        "Translates demand forecasts into stock recommendations, buffer sizing, and risk classification.",
    },
    {
      title: "AI Insights Engine",
      description:
        "Generates explainable alerts by correlating demand, festivals, weather, and price movement signals.",
    },
    {
      title: "Model Evaluation",
      description:
        "Tracks accuracy (MAE, MAPE), compares AI vs baseline models, and exposes improvements transparently.",
    },
  ];

  const architecture: ArchitectureBlock[] = [
    {
      name: "API Gateway",
      role: "Request Orchestration",
      description:
        "Handles authentication, validation, and routing for forecast and analysis requests.",
    },
    {
      name: "Forecast Engine",
      role: "Prediction Core",
      description:
        "Executes trained ML models to produce demand forecasts with confidence bounds.",
    },
    {
      name: "Insights Engine",
      role: "Reasoning Layer",
      description:
        "Evaluates forecasts against contextual signals to generate actionable insights.",
    },
    {
      name: "Data Platform",
      role: "Persistence & History",
      description:
        "Stores historical sales, forecasts, feedback, and evaluation metrics for retraining and audits.",
    },
  ];

  

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6 animate-section">
            <h2 className="text-2xl font-semibold">
              AI-Driven Inventory Forecasting
            </h2>

            <p className="text-soft leading-relaxed max-w-3xl">
              This platform enables data-driven inventory decisions by combining
              machine learning forecasts with contextual intelligence and
              explainable insights.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {[
                { label: "Forecast Accuracy", value: "92%+" },
                { label: "Error Reduction", value: "−45%" },
                { label: "Decision Latency", value: "< 200ms" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="glass-card p-5 text-center transition hover:-translate-y-0.5"
                >
                  <div className="text-xl font-semibold text-[rgb(var(--emerald-main))]">
                    {m.value}
                  </div>
                  <div className="text-sm text-soft mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "problem":
        return (
          <div className="space-y-5 animate-section">
            <h2 className="text-2xl font-semibold">Why Forecasting Fails</h2>
            <p className="text-soft max-w-3xl">
              Traditional inventory planning relies on static averages and manual
              intuition, resulting in delayed reactions and inefficient stock
              decisions.
            </p>

            <ul className="list-disc list-inside text-soft space-y-1">
              <li>Seasonality and events handled manually</li>
              <li>No linkage between forecasts and stock actions</li>
              <li>Low explainability and trust</li>
              <li>High dependency on human intervention</li>
            </ul>
          </div>
        );

      case "solution":
        return (
          <div className="space-y-5 animate-section">
            <h2 className="text-2xl font-semibold">Solution Flow</h2>

            <ol className="space-y-3 max-w-3xl">
              {[
                "User selects market, product, and forecast horizon",
                "ML models generate demand forecasts",
                "Risk & buffer logic computes stock recommendations",
                "Insights engine explains upcoming demand shifts",
              ].map((step, i) => (
                <li key={i} className="glass-card p-4 flex gap-3">
                  <span className="font-semibold text-[rgb(var(--emerald-main))]">
                    {i + 1}.
                  </span>
                  <span className="text-soft">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        );

      case "architecture":
        return (
          <div className="space-y-4 animate-section">
            <h2 className="text-2xl font-semibold">System Architecture</h2>

            {architecture.map((block) => (
              <div key={block.name} className="glass-card">
                <button
                  onClick={() =>
                    setExpandedArch(
                      expandedArch === block.name ? null : block.name
                    )
                  }
                  className="w-full px-5 py-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{block.name}</div>
                    <div className="text-xs text-soft">{block.role}</div>
                  </div>

                  <ChevronDown
                    className={`transition-transform duration-300 ${
                      expandedArch === block.name ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    expandedArch === block.name
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden px-5 pb-4 text-soft border-t border-[var(--border)]">
                    {block.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "features":
        return (
          <div className="space-y-4 animate-section">
            <h2 className="text-2xl font-semibold">Core Capabilities</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="glass-card p-5 transition hover:-translate-y-0.5"
                >
                  <div className="font-medium mb-1">{f.title}</div>
                  <p className="text-soft text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "ml":
        return (
          <div className="space-y-4 animate-section">
            <h2 className="text-2xl font-semibold">ML & Evaluation</h2>
            <p className="text-soft max-w-3xl">
              Supervised learning models are continuously evaluated against
              actual sales to ensure reliability and measurable improvement.
            </p>
            <ul className="list-disc list-inside text-soft space-y-1">
              <li>Rolling MAE & MAPE tracking</li>
              <li>Baseline vs AI comparison</li>
              <li>Model drift visibility</li>
            </ul>
          </div>
        );

      case "data":
        return (
          <div className="space-y-4 animate-section">
            <h2 className="text-2xl font-semibold">Data Layer</h2>
            <p className="text-soft max-w-3xl">
              Designed for auditability, learning, and traceability across
              forecasts, insights, and feedback loops.
            </p>
            <ul className="list-disc list-inside text-soft space-y-1">
              <li>Historical sales & forecasts</li>
              <li>User feedback capture</li>
              <li>Insight generation logs</li>
            </ul>
          </div>
        );

      case "integration":
        return (
          <div className="space-y-4 animate-section">
            <h2 className="text-2xl font-semibold">Integration</h2>
            <p className="text-soft max-w-3xl">
              APIs can be integrated into dashboards, ERP systems, or procurement
              workflows.
            </p>

            <div className="glass-card p-4 font-mono text-xs text-soft">
              POST /api/forecast<br />
              POST /api/ai/insights<br />
              GET /api/model/accuracy
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  

  return (
    <div className="relative min-h-screen overflow-hidden">
      {}
      <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-emerald-400/10 blur-[120px]" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-16 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {}
        <aside className="lg:col-span-1 space-y-1">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveSection(n.id)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200 ${
                activeSection === n.id
                  ? "bg-[rgba(var(--emerald-main),0.14)] text-[rgb(var(--emerald-main))]"
                  : "text-soft hover:bg-[rgba(var(--glass-white),0.15)]"
              }`}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </aside>

        {}
        <section className="lg:col-span-3 glass-card p-6">
          {renderSection()}
        </section>
      </main>

      <DashFooter />

      {}
      <style>{`
        .animate-section {
          animation: fadeSlide 0.35s ease-out;
        }

        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
