// Caption tracks per scene. Times are in seconds, relative to the scene start.
// fps = 30. Scenes total 900 frames = 30s.

export type CaptionLine = { text: string; from: number; to: number };

export const SCENES = {
  hook: {
    durationFrames: 120, // 4s
    voFile: "audio/voScene1.mp3",
    captions: [
      { text: "Real estate moves fast.", from: 0.2, to: 2.0 },
      { text: "You can't be in every city.", from: 2.1, to: 3.9 },
    ] as CaptionLine[],
  },
  problem: {
    durationFrames: 150, // 5s
    voFile: "audio/voScene2.mp3",
    captions: [
      { text: "Photos. Vacancy checks.", from: 0.2, to: 2.2 },
      { text: "Lockboxes. Contractor meetups.", from: 2.3, to: 4.0 },
      { text: "The deal won't wait.", from: 4.1, to: 4.95 },
    ] as CaptionLine[],
  },
  solution: {
    durationFrames: 180, // 6s
    voFile: "audio/voScene3.mp3",
    captions: [
      { text: "REI Runner is the on-demand network", from: 0.3, to: 2.8 },
      { text: "of vetted local runners —", from: 2.9, to: 4.4 },
      { text: "anywhere in the U.S.", from: 4.5, to: 5.95 },
    ] as CaptionLine[],
  },
  how: {
    durationFrames: 210, // 7s
    voFile: "audio/voScene4.mp3",
    captions: [
      { text: "Post a task.", from: 0.2, to: 1.7 },
      { text: "A nearby runner claims it.", from: 1.8, to: 3.8 },
      { text: "Geo-tagged proof in hours.", from: 3.9, to: 6.9 },
    ] as CaptionLine[],
  },
  marketplace: {
    durationFrames: 180, // 6s
    voFile: "audio/voScene5.mp3",
    captions: [
      { text: "Investors get eyes on the ground.", from: 0.2, to: 2.8 },
      { text: "Runners get flexible, well-paid work.", from: 2.9, to: 5.95 },
    ] as CaptionLine[],
  },
  close: {
    durationFrames: 60, // 2s
    voFile: "audio/voScene6.mp3",
    captions: [
      { text: "Boots on the ground, nationwide.", from: 0.1, to: 1.95 },
    ] as CaptionLine[],
  },
};

export const VO_SCRIPT = [
  "Real estate moves fast. You can't be in every city.",
  "Photos. Vacancy checks. Lockboxes. Contractor meetups. The deal won't wait.",
  "REI Runner is the on-demand network of vetted local runners, anywhere in the U.S.",
  "Post a task. A nearby runner claims it. Get geo-tagged proof in hours, not days.",
  "Investors get eyes on the ground. Runners get flexible, well-paid local work.",
  "REI Runner. Boots on the ground, nationwide.",
];