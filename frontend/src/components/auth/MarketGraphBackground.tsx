import "./auth.css";
export default function MarketGraphBackground() {
  return (
    <svg
      className="absolute inset-x-0 top-0 h-105 w-full"
      viewBox="0 0 1200 420"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {}
      <path
        d="M0 300 C 120 280, 240 200, 360 220 C 480 240, 600 160, 720 180 C 840 200, 960 120, 1080 140 C 1140 150, 1180 120, 1200 100"
        className="market-line line-strong"
      />

      {}
      <path
        d="M0 260 C 140 240, 280 260, 420 190 C 560 130, 700 170, 840 150 C 980 130, 1120 90, 1200 80"
        className="market-line line-medium"
      />

      {}
      <path
        d="M0 320 C 160 300, 320 280, 480 260 C 640 240, 800 260, 960 240 C 1100 220, 1200 230, 1200 230"
        className="market-line line-soft"
      />

      {}
      <path
        d="M0 340 C 200 330, 400 310, 600 300 C 800 290, 1000 300, 1200 280"
        className="market-line line-faint"
      />

      <path
        d="M0 220 C 180 200, 360 220, 540 160 C 720 100, 900 140, 1080 120"
        className="market-line line-faint delay-1"
      />

      <path
        d="M0 360 C 220 340, 440 360, 660 330 C 880 300, 1080 320, 1200 300"
        className="market-line line-faint delay-2"
      />
    </svg>
  );
}
