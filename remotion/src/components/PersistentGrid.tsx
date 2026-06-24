import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

export const PersistentGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame * 0.4) % 80;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.35 }}
      >
        <defs>
          <pattern
            id="grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
            x={offset}
            y={offset}
          >
            <circle cx="1" cy="1" r="1" fill="#2A2A33" />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};