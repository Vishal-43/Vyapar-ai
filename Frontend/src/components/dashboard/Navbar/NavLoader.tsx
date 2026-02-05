
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface NavLoaderProps {
  open: boolean;
  children: React.ReactNode;
}

function NavSkeleton() {
  return (
    <div className="h-full px-5 py-6 bg-[#0f1f1b]">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-[#1a2f29]" />
        <div className="h-6 w-6 rounded bg-[#1a2f29]" />
      </div>

      <div className="my-6 h-px bg-[#1f3a33]" />

      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-[#1a2f29]"
          />
        ))}
      </div>

      <div className="my-6 h-px bg-[#1f3a33]" />

      <div className="h-4 w-24 rounded bg-[#1a2f29]" />
    </div>
  );
}

export default function NavLoader({ open, children }: NavLoaderProps) {
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (open) {
      setShowSkeleton(true);
      const t = setTimeout(() => setShowSkeleton(false), 180);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {}
          <motion.aside
            className="
              fixed left-0 top-0 z-[70] h-full w-72
              bg-[#0f1f1b]
              border-r border-[#1f3a33]
              shadow-lg
            "
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            {showSkeleton ? <NavSkeleton /> : children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
