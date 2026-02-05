import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface NavLink {
  href: string;
  text: string;
}

const navlinks: NavLink[] = [
  { href: "/about", text: "About" },
  { href: "/docs", text: "Docs" },
  { href: "/contact", text: "Contact" },
];

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="w-full z-50"
    >
      {}
      <div className="w-full flex justify-center">
        {}
        <div
          className="
            w-300
            h-18
            px-6
            flex
            items-center
            gap-8
            z-50
          "
        >
          {}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/icon.png"
              alt="Vypaar AI logo"
              className="h-9 w-9"
            />
            <span className="text-[18px] font-semibold text-emerald-100">
              Vypaar AI
            </span>
          </Link>

          {}
          <div className="ml-auto flex gap-6">
            {navlinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="
                  text-[14px] font-medium
                  text-emerald-100/90
                  hover:text-emerald-400
                  transition-colors duration-200
                "
              >
                {link.text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
