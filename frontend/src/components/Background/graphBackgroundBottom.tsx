import "./market-bottom.css";

export default function GraphBackgroundBottom() {
  return (
    <svg
      className="market-graph-bottom"
      viewBox="0 0 420 1200"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {}
      <path
        d="
          M210 1200
          C 220 1040, 180 880, 210 720
          C 240 560, 180 400, 210 240
          C 220 120, 200 20, 210 0
        "
        className="market-line-bottom line-strong-bottom"
      />

      {}
      <path
        d="
          M150 1200
          C 160 1020, 120 840, 150 660
          C 180 480, 120 300, 150 120
        "
        className="market-line-bottom line-medium-bottom"
      />

      {}
      <path
        d="
          M270 1200
          C 280 1000, 240 820, 270 640
          C 300 460, 240 280, 270 100
        "
        className="market-line-bottom line-soft-bottom"
      />

      {}
      <path
        d="
          M90 1200
          C 100 980, 70 760, 90 540
          C 110 320, 70 160, 90 0
        "
        className="market-line-bottom line-faint-bottom delay-1"
      />

      <path
        d="
          M330 1200
          C 340 960, 310 740, 330 520
          C 350 300, 310 160, 330 0
        "
        className="market-line-bottom line-faint-bottom delay-2"
      />
    </svg>
  );
}
