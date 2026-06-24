import { AbsoluteFill, Series } from "remotion";
import { PersistentGrid } from "./components/PersistentGrid";
import { AccentOrb } from "./components/AccentOrb";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Solution } from "./scenes/Solution";
import { HowItWorks } from "./scenes/HowItWorks";
import { Marketplace } from "./scenes/Marketplace";
import { Close } from "./scenes/Close";
import { SCENES } from "./captions/script";

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentGrid />
      <AccentOrb />
      <Series>
        <Series.Sequence durationInFrames={SCENES.hook.durationFrames}>
          <Hook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.problem.durationFrames}>
          <Problem />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.solution.durationFrames}>
          <Solution />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.how.durationFrames}>
          <HowItWorks />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.marketplace.durationFrames}>
          <Marketplace />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.close.durationFrames}>
          <Close />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};