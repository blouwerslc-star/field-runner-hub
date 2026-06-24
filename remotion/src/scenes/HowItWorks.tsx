import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Audio, staticFile } from "remotion";
import { COLORS } from "../theme";
import { displayFamily, fontFamily } from "../fonts";
import { Caption } from "../components/Caption";
import { SCENES } from "../captions/script";

const STEPS = [
  { n: "01", t: "Post a task", d: "Address, deliverables, budget." },
  { n: "02", t: "Runner claims", d: "Vetted, nearby, ready to go." },
  { n: "03", t: "Geo-tagged proof", d: "Review, then release payment." },
];

export const HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Audio src={staticFile(SCENES.how.voFile)} />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 110,
          fontFamily,
          color: COLORS.muted,
          fontSize: 22,
          letterSpacing: 6,
          textTransform: "uppercase",
        }}
      >
        HOW IT WORKS
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 160,
          fontFamily: displayFamily,
          fontWeight: 800,
          fontSize: 110,
          color: COLORS.text,
          letterSpacing: -4,
          lineHeight: 0.95,
        }}
      >
        Three steps. <span style={{ color: COLORS.accent }}>One platform.</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 500,
          display: "flex",
          gap: 40,
        }}
      >
        {STEPS.map((s, i) => {
          const sp = spring({ frame: frame - 20 - i * 18, fps, config: { damping: 18, stiffness: 150 } });
          return (
            <div
              key={s.n}
              style={{
                flex: 1,
                opacity: sp,
                transform: `translateX(${(1 - sp) * -60}px)`,
                background: COLORS.surface,
                border: `1px solid ${COLORS.surfaceHi}`,
                borderRadius: 28,
                padding: 44,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontFamily: displayFamily,
                  fontWeight: 900,
                  fontSize: 28,
                  color: COLORS.accent,
                  letterSpacing: 4,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontFamily: displayFamily,
                  fontWeight: 800,
                  fontSize: 58,
                  color: COLORS.text,
                  marginTop: 18,
                  lineHeight: 1.0,
                  letterSpacing: -2,
                }}
              >
                {s.t}
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 24,
                  color: COLORS.muted,
                  marginTop: 18,
                }}
              >
                {s.d}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: COLORS.accent,
                  transform: `scaleX(${sp})`,
                  transformOrigin: "left",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* connecting arrows */}
      <Caption lines={SCENES.how.captions} />
    </AbsoluteFill>
  );
};