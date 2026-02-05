import { useRef } from "react";

const ArchitectureSection: React.FC = () => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateX = ((y - midY) / midY) * -6;
    const rotateY = ((x - midX) / midX) * 6;

    cardRef.current.style.transform = `
      perspective(1200px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.03)
    `;
  };

  const handleMouseLeave = (): void => {
    if (!cardRef.current) return;

    cardRef.current.style.transform = `
      perspective(1200px)
      rotateX(0deg)
      rotateY(0deg)
      scale(1)
    `;
  };

  return (
    <section
      id="architecture"
      className="
        relative

        text-gray-100
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        {}
        <h2 className="text-4xl font-semibold tracking-tight">
          Technical Architecture
        </h2>

        <p className="mt-4 max-w-3xl mx-auto text-gray-300">
          A real-time, event-driven pipeline combining feature extraction,
          AI inference, explainability, and enforcement layers.
        </p>

        {}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="
            mt-16
            mx-auto
            max-w-5xl
            rounded-3xl
            border border-emerald-800/50
            bg-emerald-900/40
            backdrop-blur-sm
            p-2
            transition-transform
            duration-200
            ease-out
            will-change-transform
            shadow-[0_40px_80px_-30px_rgba(16,185,129,0.35)]
          "
        >
          {}
          <div
            className="
              bg-white
              rounded-2xl
              p-4
              shadow-inner
            "
          >
            <img
              src="/tech-diagram.png"
              alt="System Architecture Diagram"
              className="
                w-full
                rounded-xl
                select-none
                pointer-events-none
              "
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
