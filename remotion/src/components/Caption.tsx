import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { CaptionLine } from "../captions/script";
import { COLORS } from "../theme";
import { fontFamily as bodyFont } from "../fonts";

export const Caption: React.FC<{ lines: CaptionLine[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = lines.find((l) => t >= l.from && t <= l.to);
  if (!active) return null;
  const localFrame = frame - active.from * fps;
  const fadeIn = interpolate(localFrame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame,
    [active.to * fps - 6, active.to * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);
  const ty = interpolate(fadeIn, [0, 1], [10, 0]);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 90,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${ty}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(10,10,11,0.75)",
          border: `1px solid ${COLORS.surfaceHi}`,
          padding: "14px 28px",
          borderRadius: 999,
          fontFamily: bodyFont,
          fontSize: 34,
          fontWeight: 500,
          color: COLORS.text,
          letterSpacing: -0.2,
        }}
      >
        {active.text}
      </div>
    </div>
  );
};