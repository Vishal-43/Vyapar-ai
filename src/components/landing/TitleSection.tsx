

import { motion } from "framer-motion";

interface SectionTitleProps {
  title: string;
  description: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  description,
}) => {
  const words = title.split(" ");
  const lastWord = words.pop() ?? "";
  const firstPart = words.join(" ");

  return (
    <div className="flex flex-col items-center mt-20">
      <motion.h2
        className="text-center text-4xl font-semibold max-w-2xl text-gray-100"
        initial={{ y: 80, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 320, damping: 70 }}
      >
        {firstPart}{" "}
        <motion.span
          className="
            bg-linear-to-t
            from-emerald-500 to-transparent
            p-1
            bg-left
            inline-block
            bg-no-repeat
          "
          initial={{ backgroundSize: "0% 100%" }}
          whileInView={{ backgroundSize: "100% 100%" }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeInOut" }}
        >
          {lastWord}
        </motion.span>
      </motion.h2>

      <motion.p
        className="text-center text-gray-200 max-w-lg mt-3"
        initial={{ y: 120, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 240, damping: 70 }}
      >
        {description}
      </motion.p>
    </div>
  );
};
export default SectionTitle;