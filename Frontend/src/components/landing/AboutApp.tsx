import { motion } from "framer-motion";
import {
  Zap,
  Palette,
  Puzzle,
} from "lucide-react";
import SectionTitle from "./TitleSection";

interface AboutItem {
  title: string;
  description: string;
  icon: React.ElementType;
  className: string;
}

export default function AboutOurApps() {
  const sectionData: AboutItem[] = [
    {
      title: "Lightning-Fast Performance",
      description:
        "Built with speed — minimal load times and highly optimized execution.",
      icon: Zap,
      className:
        "py-10 border-b border-emerald-800 md:py-0 md:border-r md:border-b-0 md:px-10",
    },
    {
      title: "Beautifully Designed Components",
      description:
        "Modern, pixel-perfect UI components ready for any production system.",
      icon: Palette,
      className:
        "py-10 border-b border-emerald-800 md:py-0 lg:border-r md:border-b-0 md:px-10",
    },
    {
      title: "Plug-and-Play Integration",
      description:
        "Simple setup with first-class support for React, Next.js, and Tailwind.",
      icon: Puzzle,
      className: "py-10 md:py-0 md:px-10",
    },
  ];

  return (
    <section
      className="flex flex-col items-center text-gray-100"
      id="about"
    >
      <SectionTitle
        title="About our apps"
        description="Carefully engineered applications focused on performance, usability, and scalability."
      />

      <div
        className="
          relative max-w-5xl mx-auto
          grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
          px-8 md:px-0 mt-18
          mb-20
        
        "
      >
        {sectionData.map((data, index) => {
          const Icon = data.icon;

          return (
            <motion.div
              key={data.title}
              className={data.className}
              initial={{ y: 150, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.15,
                type: "spring",
                stiffness: 320,
                damping: 70,
              }}
            >
              {}
              <div
                className="
                  size-10
                  flex items-center justify-center
                  rounded-md
                  bg-emerald-600/15
                  border border-emerald-600/30
                "
              >
                <Icon className="size-5 text-gray-400" />
              </div>

              {}
              <div className="mt-5 space-y-2">
                <h3 className="text-base font-medium text-white">
                  {data.title}
                </h3>
                <p className="text-sm text-gray-300">
                  {data.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
