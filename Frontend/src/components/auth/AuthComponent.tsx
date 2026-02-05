import { SignIn, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../dashboard/Footer";

import GraphBackgroundCorner from "../Background/GraphBackgroundCorner";

function AuthSkeleton() {
  return (
    <div className="w-90 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 animate-pulse">
      <div className="h-6 w-2/3 rounded bg-white/10 mb-3" />
      <div className="h-4 w-1/2 rounded bg-white/10 mb-6" />

      <div className="space-y-4">
        <div className="h-10 rounded bg-white/10" />
        <div className="h-10 rounded bg-white/10" />
        <div className="h-10 rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function AuthComponent() {
  const { isLoaded } = useAuth();

  return (
    <div>
      <div className="relative min-h-screen bg-[#050807] overflow-hidden">
        {}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_55%)] pointer-events-none" />

        <GraphBackgroundCorner />

        {}
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <AnimatePresence mode="wait">
            {}
            {!isLoaded && (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AuthSkeleton />
              </motion.div>
            )}

            {}
            {isLoaded && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {}
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>

                {}
                <SignedOut>
                  <SignIn
                    appearance={{
                      variables: {
                        colorPrimary: "#10b981",
                        colorBackground: "transparent",
                        colorText: "#e5e7eb",
                        colorTextSecondary: "#9ca3af",
                        borderRadius: "14px",
                      },
                      elements: {
                        card: `
                          bg-white/5 
                          backdrop-blur-xl 
                          border 
                          border-white/10 
                          shadow-[0_0_40px_rgba(16,185,129,0.08)]
                          rounded-2xl
                        `,
                        headerTitle: "text-2xl font-semibold text-white",
                        headerSubtitle: "text-gray-400",
                        socialButtonsBlockButton:
                          "bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10",
                        formButtonPrimary:
                          "bg-emerald-500 hover:bg-emerald-600 text-black font-medium",
                        formFieldInput:
                          "bg-black/40 border border-white/10 text-white focus:border-emerald-400",
                        footerActionText: "text-gray-400",
                        footerActionLink:
                          "text-emerald-400 hover:text-emerald-300",
                        identityPreviewText: "text-gray-300",
                        dividerLine: "bg-white/10",
                        dividerText: "text-gray-500",
                      },
                    }}
                  />
                </SignedOut>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      <Footer />
      </div>

    </div>
  );
}
