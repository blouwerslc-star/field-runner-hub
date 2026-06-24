import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const AccentOrb: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 1040], [-200, 1920], { extrapolateRight: "clamp" });
  const y = 700 + Math.sin(frame / 60) * 120;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(249,115,22,0.22) 0%, rgba(249,115,22,0) 65%)",
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  );
};