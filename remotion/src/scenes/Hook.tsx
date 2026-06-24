import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, Audio, staticFile } from "remotion";
import { COLORS } from "../theme";
import { displayFamily, fontFamily } from "../fonts";
import { Caption } from "../components/Caption";
import { SCENES } from "../captions/script";

const WORDS = ["REAL", "ESTATE", "MOVES", "FAST."];

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Audio src={staticFile(SCENES.hook.voFile)} />
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 110,
          fontFamily: fontFamily,
          color: COLORS.muted,
          fontSize: 22,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: spring({ frame: frame - 4, fps, config: { damping: 22 } }),
        }}
      >
        <span style={{ color: COLORS.accent }}>●</span> REI RUNNER
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 260,
          fontFamily: displayFamily,
          fontWeight: 900,
          fontSize: 220,
          color: COLORS.text,
          lineHeight: 0.95,
          letterSpacing: -6,
        }}
      >
        {WORDS.map((w, i) => {
          const s = spring({ frame: frame - i * 7, fps, config: { damping: 18, stiffness: 140 } });
          const y = (1 - s) * 80;
          const accent = i === WORDS.length - 1;
          return (
            <div
              key={w}
              style={{
                opacity: s,
                transform: `translateY(${y}px)`,
                color: accent ? COLORS.accent : COLORS.text,
              }}
            >
              {w}
            </div>
          );
        })}
      </div>
      <Caption lines={SCENES.hook.captions} />
    </AbsoluteFill>
  );
};