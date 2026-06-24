import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/InterTight";

const body = loadBody("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
const display = loadDisplay("normal", { weights: ["700", "900"], subsets: ["latin"] });

export const fontFamily = body.fontFamily;
export const displayFamily = display.fontFamily;