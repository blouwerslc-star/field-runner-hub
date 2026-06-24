import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { SCENES } from "./captions/script";

const total =
  SCENES.hook.durationFrames +
  SCENES.problem.durationFrames +
  SCENES.solution.durationFrames +
  SCENES.how.durationFrames +
  SCENES.marketplace.durationFrames +
  SCENES.close.durationFrames;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={total}
    fps={30}
    width={1920}
    height={1080}
  />
);