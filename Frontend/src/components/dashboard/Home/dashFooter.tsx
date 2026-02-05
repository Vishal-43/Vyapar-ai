import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const DashFooter: React.FC = () => {
  return (
    <motion.footer
      className="
        mt-40
        px-6 md:px-16 lg:px-24 xl:px-32
        text-sm 
      "
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-14 z-999">
        {}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold ">
              Vypaar AI
            </span>
          </div>

          <p className="mt-6 text-sm leading-relaxed  max-w-md">
            Enterprise-grade intelligence platform built to transform forecasting,
            planning, and operational decision-making using real-world signals
            and AI-driven insights.
          </p>
        </div>

        {}
        <div className="flex lg:items-center lg:justify-center">
          <div className="flex flex-col space-y-2.5">
            <h3 className="font-semibold  mb-4">
              Company
            </h3>

            <Link to="/about" className="hover:text-emerald-400 transition">
              About
            </Link>

            <Link to="/docs" className="hover:text-emerald-400 transition">
              Documentation
            </Link>

            <Link to="/contact" className="hover:text-emerald-400 transition">
              Contact
            </Link>

            <Link to="/privacy" className="hover:text-emerald-400 transition">
              Privacy Policy
            </Link>
          </div>
        </div>

        {}
        <div>
          <h3 className="font-semibold  mb-4">
            Subscribe to updates
          </h3>

          <p className="text-sm  max-w-sm">
            Product updates, engineering notes, and release announcements —
            delivered occasionally.
          </p>

        </div>
      </div>

      {}
      <div className="mt-14 border-t border-emerald-900/60" />

      {}
      <div
        className="
          py-6
          flex flex-col sm:flex-row
          items-center justify-between
          gap-3
          text-xs sm:text-sm
          
        "
      >
        <span>
          © {new Date().getFullYear()} Vypaar AI. All rights reserved.
        </span>

        <span >
          Built with precision and intent
        </span>
      </div>
    </motion.footer>
  );
};

export default DashFooter;
