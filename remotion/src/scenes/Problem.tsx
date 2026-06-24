import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Audio, staticFile } from "remotion";
import { COLORS } from "../theme";
import { displayFamily, fontFamily } from "../fonts";
import { Caption } from "../components/Caption";
import { SCENES } from "../captions/script";

const CHIPS = [
  { label: "Photos", glyph: "📷" },
  { label: "Vacancy Check", glyph: "🏚" },
  { label: "Lockbox", glyph: "🔒" },
  { label: "Contractor Meetup", glyph: "🔧" },
];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tick = Math.floor((frame / fps) * 1) % 60;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(SCENES.problem.voFile)} />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 140,
          fontFamily,
          color: COLORS.muted,
          fontSize: 22,
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        THE FIELD WORK PROBLEM
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 200,
          fontFamily: displayFamily,
          fontWeight: 800,
          fontSize: 96,
          color: COLORS.text,
          letterSpacing: -3,
          lineHeight: 1.0,
          maxWidth: 1400,
        }}
      >
        Every deal needs <span style={{ color: COLORS.accent }}>boots on the ground</span>.
      </div>

      {/* chips */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 480,
          display: "flex",
          flexWrap: "wrap",
          gap: 28,
          maxWidth: 1500,
        }}
      >
        {CHIPS.map((c, i) => {
          const s = spring({ frame: frame - 10 - i * 8, fps, config: { damping: 16, stiffness: 160 } });
          return (
            <div
              key={c.label}
              style={{
                opacity: s,
                transform: `translateY(${(1 - s) * 30}px) scale(${0.92 + s * 0.08})`,
                background: COLORS.surface,
                border: `1px solid ${COLORS.surfaceHi}`,
                padding: "22px 34px",
                borderRadius: 18,
                fontFamily,
                color: COLORS.text,
                fontSize: 38,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 18,
              }}
            >
              <span style={{ fontSize: 42 }}>{c.glyph}</span>
              {c.label}
            </div>
          );
        })}
      </div>

      {/* ticking clock */}
      <div
        style={{
          position: "absolute",
          right: 140,
          top: 760,
          width: 220,
          height: 220,
          borderRadius: "50%",
          border: `3px solid ${COLORS.surfaceHi}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 4,
            height: 88,
            background: COLORS.accent,
            top: 22,
            borderRadius: 2,
            transformOrigin: "50% 88px",
            transform: `rotate(${tick * 6}deg)`,
          }}
        />
        <div style={{ width: 16, height: 16, borderRadius: 8, background: COLORS.accent }} />
      </div>

      <div
        style={{
          position: "absolute",
          right: 140,
          top: 1000,
          fontFamily,
          color: COLORS.muted,
          fontSize: 20,
          letterSpacing: 4,
          textTransform: "uppercase",
          opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        THE DEAL WON'T WAIT
      </div>

      <Caption lines={SCENES.problem.captions} />
    </AbsoluteFill>
  );
};