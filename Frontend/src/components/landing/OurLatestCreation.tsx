import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionTitle from "./TitleSection";

interface SectionItem {
  title: string;
  description: string;
  image: string;
  align: string;
}

const OurLatestCreation: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionClass, setTransitionClass] = useState("");

  const sectionData: SectionItem[] = [
    {
      title: "Prompt engineers",
      description:
        "Bridging the gap between human intent and machine understanding through expert prompt design.",
      image:
        "https://images.unsplash.com/photo-1543269865-0a740d43b90c?q=80&w=800&h=400&auto=format&fit=crop",
      align: "object-center",
    },
    {
      title: "Data scientists",
      description:
        "Turning data into actionable insights that drive intelligent innovation and growth.",
      image:
        "https://images.unsplash.com/photo-1714976326351-0ecf0244f0fc?q=80&w=800&h=400&auto=format&fit=crop",
      align: "object-right",
    },
    {
      title: "Software engineers",
      description:
        "Building scalable and efficient systems that bring ideas to life through code.",
      image:
        "https://images.unsplash.com/photo-1736220690062-79e12ca75262?q=80&w=800&h=400&auto=format&fit=crop",
      align: "object-center",
    },
  ];

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sectionData.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered, sectionData.length]);

  return (
    <section
      className="flex flex-col items-center text-white"
      id="creations"
    >
      <SectionTitle
        title="Our latest creation"
        description="A visual collection of our most recent works — each piece crafted with intention, emotion, and style."
      />

      <div
        className="
          flex items-center gap-4
          h-100
          w-full max-w-5xl
          mt-18 mx-auto
          px-4
        "
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {sectionData.map((data, index) => {
          const isActive = index === activeIndex;

          return (
            <motion.div
              key={data.title}
              className={`
                relative group
                h-full rounded-xl overflow-hidden
                ${transitionClass}
                ${
                  isHovered
                    ? "hover:flex-4 flex-1"
                    : isActive
                    ? "flex-4"
                    : "flex-1"
                }
              `}
              initial={{ y: 150, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              onAnimationComplete={() =>
                setTransitionClass("transition-all duration-500")
              }
              transition={{
                delay: index * 0.15,
                type: "spring",
                stiffness: 320,
                damping: 70,
              }}
            >
              <img
                src={data.image}
                alt={data.title}
                className={`h-full w-full object-cover ${data.align}`}
              />

              <div
                className={`
                  absolute inset-0
                  flex flex-col justify-end
                  p-10
                  text-white
                  bg-black/50
                  transition-opacity duration-300
                  ${
                    isHovered
                      ? "opacity-0 group-hover:opacity-100"
                      : isActive
                      ? "opacity-100"
                      : "opacity-0"
                  }
                `}
              >
                <h3 className="text-3xl font-semibold">{data.title}</h3>
                <p className="text-sm mt-2 text-white/90">
                  {data.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default OurLatestCreation;
