import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Audio, staticFile, interpolate } from "remotion";
import { COLORS } from "../theme";
import { displayFamily, fontFamily } from "../fonts";
import { Caption } from "../components/Caption";
import { SCENES } from "../captions/script";

// Stylized US dot map: a grid of dots masked roughly to the US shape via x/y bounds.
const DOTS: Array<{ x: number; y: number; key: string; isPin?: boolean }> = [];
const COLS = 36;
const ROWS = 16;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    // Loose US silhouette mask
    const nx = c / (COLS - 1);
    const ny = r / (ROWS - 1);
    // Skip corners to imply shape
    const tl = nx < 0.18 && ny < 0.25;
    const tr = nx > 0.78 && ny < 0.2;
    const bl = nx < 0.22 && ny > 0.7;
    const br = nx > 0.85 && ny > 0.65;
    if (tl || tr || bl || br) continue;
    DOTS.push({ x: c, y: r, key: `${r}-${c}` });
  }
}

const PIN_POSITIONS = [
  { x: 5, y: 6 },    // SF
  { x: 8, y: 10 },   // LA
  { x: 12, y: 4 },   // Seattle-ish... approx
  { x: 14, y: 9 },   // Denver
  { x: 18, y: 11 },  // Dallas
  { x: 22, y: 6 },   // Chicago
  { x: 26, y: 9 },   // Atlanta
  { x: 30, y: 5 },   // NYC
  { x: 28, y: 11 },  // Tampa
  { x: 24, y: 4 },   // Detroit
];

export const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cell = 38;
  const mapW = COLS * cell;
  const mapH = ROWS * cell;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(SCENES.solution.voFile)} />
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
        THE SOLUTION
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 160,
          fontFamily: displayFamily,
          fontWeight: 900,
          fontSize: 130,
          color: COLORS.text,
          letterSpacing: -5,
          lineHeight: 0.95,
          maxWidth: 1500,
        }}
      >
        A vetted runner <br />
        in <span style={{ color: COLORS.accent }}>every market</span>.
      </div>

      {/* map */}
      <div
        style={{
          position: "absolute",
          left: (1920 - mapW) / 2,
          top: 560,
          width: mapW,
          height: mapH,
        }}
      >
        {DOTS.map((d) => {
          const idx = d.x + d.y;
          const s = spring({ frame: frame - idx * 0.6, fps, config: { damping: 30 } });
          return (
            <div
              key={d.key}
              style={{
                position: "absolute",
                left: d.x * cell,
                top: d.y * cell,
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "#2C2C36",
                opacity: s,
              }}
            />
          );
        })}
        {PIN_POSITIONS.map((p, i) => {
          const delay = 40 + i * 6;
          const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 200 } });
          const pulse = interpolate(
            (frame - delay) % 30,
            [0, 15, 30],
            [0.4, 1, 0.4]
          );
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: p.x * cell - 14,
                  top: p.y * cell - 14,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: COLORS.accent,
                  opacity: 0.18 * pulse * s,
                  transform: `scale(${1 + pulse * 0.8})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: p.x * cell - 5,
                  top: p.y * cell - 5,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: COLORS.accent,
                  boxShadow: `0 0 18px ${COLORS.accent}`,
                  opacity: s,
                  transform: `scale(${s})`,
                }}
              />
            </div>
          );
        })}
      </div>

      <Caption lines={SCENES.solution.captions} />
    </AbsoluteFill>
  );
};