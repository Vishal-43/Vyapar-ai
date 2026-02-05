import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion,  useSpring } from "framer-motion";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  return (
    <section className="relative flex flex-col items-center -mt-18 text-white">
 
      {}
      <motion.svg
        className="absolute -z-10 -mt-40 md:mt-0"
        width="1680"
        height="450"
        viewBox="0 130 1440 540"
        fill="none"
       
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <rect
          x="-92"
          y="-948"
          width="1624"
          height="1624"
          rx="812"
          fill="url(#heroGradient)"
        />
        <defs>
          <radialGradient
            id="heroGradient"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(90 428 292)scale(812)"
          >
            <stop offset=".6" stopColor="#10b981" stopOpacity="0" />
            <stop offset="1" stopColor="#065f46" />
          </radialGradient>
        </defs>
      </motion.svg>

      {}
      <motion.a
        className="
          flex items-center mt-48 gap-2
          border border-gray-400
          text-white
          rounded-full px-4 py-2
          backdrop-blur-sm
        "
        initial={{ y: -20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70 }}
      >
        <span className="size-2.5 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-sm">Book a live demo today</span>
      </motion.a>

      {}
      <motion.h1
        className="
          text-center mt-4
          text-5xl md:text-6xl
          leading-17 md:leading-18
          font-semibold max-w-2xl
        "
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 240, damping: 70 }}
      >
        Let’s build AI agents together
      </motion.h1>

      {}
      <motion.p
        className="text-center text-base text-white max-w-lg mt-3"
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 70 }}
      >
        Our platform helps you build, test, and deliver faster — so you can focus
        on what matters.
      </motion.p>

      {}
      <motion.div
        className="flex items-center gap-4 mt-8"
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 320, damping: 70 }}
      >
        <Link to="/dashboard/selector">
        <button
          className="
            flex items-center gap-2
            bg-emerald-600 hover:bg-emerald-700
            transition text-white
            active:scale-95
            rounded-lg px-7 h-11
            cursor-pointer
          "
        >
          Get started
          <ArrowRight className="size-5" />
        </button>
          </Link>

        <button
          className="
            border border-emerald-700
            hover:bg-emerald-900/40
            transition active:scale-95
            rounded-lg px-8 h-11
          "
        >
          Book a demo
        </button>
      </motion.div>

      {}
      <TiltedImage />
    </section>
  );
};

export default HeroSection;

interface TiltedImageProps {
  rotateAmplitude?: number;
}

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

const TiltedImage: React.FC<TiltedImageProps> = ({
  rotateAmplitude = 3,
}) => {
  const ref = useRef<HTMLElement | null>(null);

  const rotateX = useSpring(0, springValues);
  const rotateY = useSpring(0, springValues);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1,
  });

  const [lastY, setLastY] = useState<number>(0);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLElement, MouseEvent>
  ): void => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude);
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude);

    const velocityY = offsetY - lastY;
    rotateFigcaption.set(-velocityY * 0.6);
    setLastY(offsetY);
  };

  const handleMouseLeave = (): void => {
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  };

  return (
    <motion.figure
      ref={ref}
      className="
        relative mt-16
        w-full max-w-4xl mx-auto
        perspective-midrange
        flex items-center justify-center
      "
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ y: 150, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 320, damping: 70 }}
    >
      <motion.div
        className="
          relative w-full
          transform-3d
        "
        style={{ rotateX, rotateY }}
      >
        <img
          src="/image.png"
          alt="Hero showcase"
          className="
            w-full rounded-[15px]
            will-change-transform
            transform-[translateZ(0)]
          "
        />
      </motion.div>
    </motion.figure>
  );
};
