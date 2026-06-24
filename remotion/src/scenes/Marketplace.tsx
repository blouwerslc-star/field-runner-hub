import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Audio, staticFile, interpolate } from "remotion";
import { COLORS } from "../theme";
import { displayFamily, fontFamily } from "../fonts";
import { Caption } from "../components/Caption";
import { SCENES } from "../captions/script";

const InvestorCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const sp = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 140 } });
  const count = Math.floor(interpolate(frame, [10, 80], [0, 247], { extrapolateRight: "clamp" }));
  return (
    <div
      style={{
        flex: 1,
        opacity: sp,
        transform: `translateX(${(1 - sp) * -60}px)`,
        background: COLORS.surface,
        border: `1px solid ${COLORS.surfaceHi}`,
        borderRadius: 28,
        padding: 52,
      }}
    >
      <div style={{ fontFamily, color: COLORS.accent, fontSize: 22, letterSpacing: 4, textTransform: "uppercase" }}>
        For Investors
      </div>
      <div style={{ fontFamily: displayFamily, fontWeight: 800, fontSize: 70, color: COLORS.text, marginTop: 18, letterSpacing: -2, lineHeight: 1.0 }}>
        Eyes on every property.
      </div>
      <div style={{ fontFamily, color: COLORS.muted, fontSize: 24, marginTop: 16, lineHeight: 1.5 }}>
        Photos, walkthroughs, vacancy verification — without the flight.
      </div>
      <div style={{ marginTop: 36, display: "flex", gap: 32 }}>
        <div>
          <div style={{ fontFamily: displayFamily, fontWeight: 900, fontSize: 64, color: COLORS.text }}>{count}</div>
          <div style={{ fontFamily, fontSize: 18, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 2 }}>Tasks fulfilled</div>
        </div>
        <div>
          <div style={{ fontFamily: displayFamily, fontWeight: 900, fontSize: 64, color: COLORS.text }}>&lt; 4h</div>
          <div style={{ fontFamily, fontSize: 18, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 2 }}>Median turnaround</div>
        </div>
      </div>
    </div>
  );
};

const RunnerCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const sp = spring({ frame: frame - 14, fps, config: { damping: 18, stiffness: 140 } });
  const earnings = Math.floor(interpolate(frame, [20, 100], [0, 1840], { extrapolateRight: "clamp" }));
  return (
    <div
      style={{
        flex: 1,
        opacity: sp,
        transform: `translateX(${(1 - sp) * 60}px)`,
        background: COLORS.surface,
        border: `1px solid ${COLORS.surfaceHi}`,
        borderRadius: 28,
        padding: 52,
      }}
    >
      <div style={{ fontFamily, color: COLORS.accent, fontSize: 22, letterSpacing: 4, textTransform: "uppercase" }}>
        For Runners
      </div>
      <div style={{ fontFamily: displayFamily, fontWeight: 800, fontSize: 70, color: COLORS.text, marginTop: 18, letterSpacing: -2, lineHeight: 1.0 }}>
        Local work, on your schedule.
      </div>
      <div style={{ fontFamily, color: COLORS.muted, fontSize: 24, marginTop: 16, lineHeight: 1.5 }}>
        Pick tasks that fit. Get paid per job. Build a public profile.
      </div>
      <div style={{ marginTop: 36, display: "flex", gap: 32 }}>
        <div>
          <div style={{ fontFamily: displayFamily, fontWeight: 900, fontSize: 64, color: COLORS.text }}>${earnings}</div>
          <div style={{ fontFamily, fontSize: 18, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 2 }}>Top monthly earner</div>
        </div>
        <div>
          <div style={{ fontFamily: displayFamily, fontWeight: 900, fontSize: 64, color: COLORS.text }}>4.9★</div>
          <div style={{ fontFamily, fontSize: 18, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 2 }}>Avg rating</div>
        </div>
      </div>
    </div>
  );
};

export const Marketplace: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Audio src={staticFile(SCENES.marketplace.voFile)} />
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
        TWO-SIDED MARKETPLACE
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 160,
          fontFamily: displayFamily,
          fontWeight: 800,
          fontSize: 96,
          color: COLORS.text,
          letterSpacing: -3,
          lineHeight: 0.95,
        }}
      >
        Built for both sides.
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 380,
          display: "flex",
          gap: 40,
        }}
      >
        <InvestorCard frame={frame} fps={fps} />
        <RunnerCard frame={frame} fps={fps} />
      </div>
      <Caption lines={SCENES.marketplace.captions} />
    </AbsoluteFill>
  );
};