import { motion } from "framer-motion";
import SectionTitle from "./TitleSection";

const SubscribeNewsletter: React.FC = () => {
  return (
    <section className="flex flex-col items-center text-emerald-100">
      <SectionTitle
        title="Subscribe newsletter"
        description="Get product updates, engineering insights, and launch notes — delivered occasionally."
      />

      <motion.div
        className="
          mt-10
          w-full max-w-xl
          flex items-center
          rounded-full
          bg-emerald-900/40
          border border-emerald-800/60
          backdrop-blur-sm
          h-14
          px-1
          focus-within:ring-2
          focus-within:ring-emerald-500/60
          transition
        "
        initial={{ y: 150, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 320, damping: 70 }}
      >
        {}
        <input
          type="email"
          placeholder="Enter your email address"
          className="
            flex-1
            h-full
            bg-transparent
            outline-none
            px-4
            text-sm
            text-emerald-100
            placeholder:text-emerald-400
          "
        />

        {}
        <button
          className="
            h-11
            px-8
            mr-1
            rounded-full
            bg-emerald-600
            hover:bg-emerald-700
            active:scale-95
            transition
            text-white
            text-sm
            font-medium
            flex items-center justify-center
          "
        >
          Subscribe
        </button>
      </motion.div>
    </section>
  );
};

export default SubscribeNewsletter;
