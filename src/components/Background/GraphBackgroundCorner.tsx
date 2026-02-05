import "./market-corner.css";

export default function GraphBackgroundCorner() {
  return (
    <svg
      className="market-graph-corner"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {}
      <path
        d="M0 0 C 220 140, 380 300, 600 600"
        className="market-line-corner line-strong-corner"
      />
      <path
        d="M80 0 C 260 180, 420 340, 600 600"
        className="market-line-corner line-medium-corner delay-1"
      />
      <path
        d="M0 80 C 200 240, 360 380, 600 600"
        className="market-line-corner line-faint-corner delay-2"
      />

      {}
      <path
        d="M1200 0 C 980 140, 820 300, 600 600"
        className="market-line-corner line-strong-corner"
      />
      <path
        d="M1120 0 C 940 180, 780 340, 600 600"
        className="market-line-corner line-medium-corner delay-1"
      />
      <path
        d="M1200 80 C 1000 240, 840 380, 600 600"
        className="market-line-corner line-faint-corner delay-2"
      />

      {}
      <path
        d="M0 1200 C 220 980, 380 820, 600 600"
        className="market-line-corner line-strong-corner"
      />
      <path
        d="M80 1200 C 260 940, 420 780, 600 600"
        className="market-line-corner line-medium-corner delay-1"
      />
      <path
        d="M0 1120 C 200 960, 360 820, 600 600"
        className="market-line-corner line-faint-corner delay-2"
      />

      {}
      <path
        d="M1200 1200 C 980 980, 820 820, 600 600"
        className="market-line-corner line-strong-corner"
      />
      <path
        d="M1120 1200 C 940 940, 780 780, 600 600"
        className="market-line-corner line-medium-corner delay-1"
      />
      <path
        d="M1200 1120 C 1000 960, 840 820, 600 600"
        className="market-line-corner line-faint-corner delay-2"
      />
    </svg>
  );
}
