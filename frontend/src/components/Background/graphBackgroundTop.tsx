import "./market-top.css";

export default function GraphBackgroundTop() {
  return (
    <svg
      className="market-graph-top"
      viewBox="0 0 420 1200"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {}
      <path
        d="
          M210 0
          C 200 160, 240 320, 210 480
          C 180 640, 240 800, 210 960
          C 200 1080, 220 1180, 210 1200
        "
        className="market-line-top line-strong-top"
      />

      {}
      <path
        d="
          M150 0
          C 140 180, 180 360, 150 540
          C 120 720, 180 900, 150 1080
        "
        className="market-line-top line-medium-top"
      />

      {}
      <path
        d="
          M270 0
          C 260 200, 300 380, 270 560
          C 240 740, 300 920, 270 1100
        "
        className="market-line-top line-soft-top"
      />

      {}
      <path
        d="
          M90 0
          C 80 220, 110 440, 90 660
          C 70 880, 110 1040, 90 1200
        "
        className="market-line-top line-faint-top delay-1"
      />

      <path
        d="
          M330 0
          C 320 240, 350 460, 330 680
          C 310 900, 350 1060, 330 1200
        "
        className="market-line-top line-faint-top delay-2"
      />
    </svg>
  );
}
