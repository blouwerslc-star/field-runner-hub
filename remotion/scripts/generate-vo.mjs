// Generate ElevenLabs voiceovers for each scene into public/audio/voSceneN.mp3
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/audio");
fs.mkdirSync(OUT_DIR, { recursive: true });

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY missing");
  process.exit(1);
}

const VOICE = "nPczCjzI2devNBz1zQrb"; // Brian
const MODEL = "eleven_turbo_v2_5";

const SCRIPT = [
  "Real estate moves fast. You can't be in every city.",
  "Photos. Vacancy checks. Lockboxes. Contractor meetups. The deal won't wait.",
  "REI Runner is the on-demand network of vetted local runners, anywhere in the U.S.",
  "Post a task. A nearby runner claims it. Get geo-tagged proof in hours, not days.",
  "Investors get eyes on the ground. Runners get flexible, well-paid local work.",
  "REI Runner. Boots on the ground, nationwide.",
];

async function tts(text, previous, next) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        previous_text: previous,
        next_text: next,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
          speed: 1.02,
        },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS failed (${res.status}): ${err}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

for (let i = 0; i < SCRIPT.length; i++) {
  const buf = await tts(SCRIPT[i], SCRIPT[i - 1], SCRIPT[i + 1]);
  const file = path.join(OUT_DIR, `voScene${i + 1}.mp3`);
  fs.writeFileSync(file, buf);
  console.log(`wrote ${file} (${buf.length} bytes)`);
}

console.log("done");