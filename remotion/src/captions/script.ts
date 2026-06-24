// Caption tracks per scene. Times are in seconds, relative to the scene start.
// fps = 30. Scenes total 900 frames = 30s.

export type CaptionLine = { text: string; from: number; to: number };

export const SCENES = {
  hook: {
    durationFrames: 85, // ~2.83s — VO speech ends 2.61s + 0.2s pad
    voFile: "audio/voScene1.mp3",
    captions: [
      { text: "Real estate moves fast.", from: 0.1, to: 1.5 },
      { text: "You can't be in every city.", from: 1.55, to: 3.1 },
    ] as CaptionLine[],
  },
  problem: {
    durationFrames: 172, // ~5.73s — VO speech ends 5.53s + 0.2s pad
    voFile: "audio/voScene2.mp3",
    captions: [
      { text: "Photos. Vacancy checks.", from: 0.1, to: 2.4 },
      { text: "Lockboxes. Contractor meetups.", from: 2.5, to: 5.0 },
      { text: "The deal won't wait.", from: 5.05, to: 6.4 },
    ] as CaptionLine[],
  },
  solution: {
    durationFrames: 145, // ~4.83s — VO speech ends 4.61s + 0.22s pad
    voFile: "audio/voScene3.mp3",
    captions: [
      { text: "An on-demand network", from: 0.1, to: 2.0 },
      { text: "of vetted local runners —", from: 2.05, to: 3.6 },
      { text: "anywhere in the U.S.", from: 3.65, to: 5.5 },
    ] as CaptionLine[],
  },
  how: {
    durationFrames: 166, // ~5.53s — VO speech ends 5.32s + 0.21s pad
    voFile: "audio/voScene4.mp3",
    captions: [
      { text: "Post a task.", from: 0.1, to: 1.4 },
      { text: "A nearby runner claims it.", from: 1.45, to: 3.4 },
      { text: "Geo-tagged proof in hours.", from: 3.45, to: 6.2 },
    ] as CaptionLine[],
  },
  marketplace: {
    durationFrames: 171, // ~5.7s — VO speech ends 5.48s + 0.22s pad
    voFile: "audio/voScene5.mp3",
    captions: [
      { text: "Investors get eyes on the ground.", from: 0.1, to: 2.9 },
      { text: "Runners get flexible, well-paid work.", from: 2.95, to: 6.5 },
    ] as CaptionLine[],
  },
  close: {
    durationFrames: 95, // ~3.17s — VO speech ends 2.62s + 0.55s for outro
    voFile: "audio/voScene6.mp3",
    captions: [
      { text: "Boots on the ground, nationwide.", from: 0.1, to: 3.0 },
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