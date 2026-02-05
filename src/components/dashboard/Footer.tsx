import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <motion.footer
      className="
        mt-40
        px-6 md:px-16 lg:px-24 xl:px-32
        text-sm text-gray-200
      "
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-14">
        {}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="Vypaar AI logo"
              className="h-9 w-9 object-contain"
            />
            <span className="text-lg font-semibold text-gray-100">
              Vypaar AI
            </span>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-gray-300 max-w-md">
            Enterprise-grade intelligence platform built to transform forecasting,
            planning, and operational decision-making using real-world signals
            and AI-driven insights.
          </p>
        </div>

        {}
        <div className="flex lg:items-center lg:justify-center">
          <div className="flex flex-col space-y-2.5">
            <h3 className="font-semibold text-gray-100 mb-4">
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
          <h3 className="font-semibold text-gray-100 mb-4">
            Subscribe to updates
          </h3>

          <p className="text-sm text-gray-300 max-w-sm">
            Product updates, engineering notes, and release announcements —
            delivered occasionally.
          </p>

          <div
            className="
              mt-6
              flex items-center gap-2
              rounded-md
              border border-emerald-800/60
              bg-emerald-900/40
              backdrop-blur-sm
              p-2
            "
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="
                w-full
                bg-transparent
                outline-none
                px-2
                py-2
                text-sm
                text-gray-100
                placeholder:text-emerald-400
              "
            />
            <button
              className="
                px-4 py-2
                rounded-md
                bg-emerald-600
                hover:bg-emerald-700
                text-white
                text-sm
                font-medium
                transition
                active:scale-95
              "
            >
              Subscribe
            </button>
          </div>
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
          text-gray-400
        "
      >
        <span>
          © {new Date().getFullYear()} Vypaar AI. All rights reserved.
        </span>

        <span className="text-gray-500">
          Built with precision and intent
        </span>
      </div>
    </motion.footer>
  );
};

export default Footer;
