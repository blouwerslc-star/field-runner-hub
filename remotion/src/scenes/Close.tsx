import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Audio, staticFile } from "remotion";
import { COLORS } from "../theme";
import { displayFamily, fontFamily } from "../fonts";
import { Caption } from "../components/Caption";
import { SCENES } from "../captions/script";

export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 140 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Audio src={staticFile(SCENES.close.voFile)} />
      <div
        style={{
          opacity: s,
          transform: `scale(${0.94 + s * 0.06})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily,
            color: COLORS.accent,
            fontSize: 24,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          ● REI RUNNER
        </div>
        <div
          style={{
            fontFamily: displayFamily,
            fontWeight: 900,
            fontSize: 180,
            color: COLORS.text,
            letterSpacing: -6,
            lineHeight: 1.0,
          }}
        >
          Boots on the ground,
          <br />
          <span style={{ color: COLORS.accent }}>nationwide.</span>
        </div>
        <div
          style={{
            fontFamily,
            color: COLORS.muted,
            fontSize: 28,
            marginTop: 32,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          reirunner.com
        </div>
      </div>
      <Caption lines={SCENES.close.captions} />
    </AbsoluteFill>
  );
};