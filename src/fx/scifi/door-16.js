import { clamp, ease, smooth, lerp, rand, hex, WHITE } from "../../core/index.js";

export const meta = {
  name: "Digital door 16",
  desc: "A compact solid steel sci-fi door scans in place, then fades cleanly into a few falling signal fragments.",
  tags: ["scifi", "door", "digital", "scan", "one-shot", "compact"],
  size: [32, 48],
  origin: [16, 47],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#263238", "#455a64", "#607d8b", "#90a4ae", "#b0bec5", "#d7e2e7", "#ffffff"],
    seed: 12,
  },
};

const D = meta.duration, END = D - 1 / meta.fps;
const X = 0, TOP = -40, BOTTOM = -4, W = 24, H = BOTTOM - TOP;
const STEEL = hex("#b0bec5"), EDGE = hex("#607d8b"), DEEP = hex("#263238");

export function draw(p, t, o) {
  if (t >= END) return;
  const S = o.seed, fade = t > 1.28 ? 1 - smooth(1.28, END, t) : 1;
  const scanK = ease.inOutSine(clamp((t - 0.08) / 0.9));
  const scanY = lerp(BOTTOM - 2, TOP + 2, scanK);
  const left = X - W / 2, right = X + W / 2;

  // Fixed opaque steel face, with a stepped frame and no grid.
  p.rect(left + 1, TOP, W - 2, H, STEEL, fade);
  p.rect(left, TOP + 2, 1, H - 4, DEEP, fade);
  p.rect(right - 1, TOP + 2, 1, H - 4, DEEP, fade);
  p.rect(left + 1, TOP, W - 2, 2, EDGE, fade);
  p.rect(left + 1, BOTTOM - 2, W - 2, 2, EDGE, fade);
  p.rect(left + 3, TOP + 3, 1, H - 6, EDGE, fade);
  p.rect(right - 4, TOP + 3, 1, H - 6, EDGE, fade);

  // The single scan band is the only moving part before the fade.
  if (t >= 0.08 && t < 1.24) {
    const sy = Math.round(scanY);
    p.rect(left + 2, sy - 1, W - 4, 2, WHITE, fade);
    p.glowLine(left + 2, sy, right - 2, sy, 5, STEEL, 0.42 * fade);
    p.line(left + 2, sy + 1, right - 2, sy + 1, EDGE, 0.9 * fade);
  }

  p.rect(X - 14, BOTTOM, 28, 2, DEEP, fade);
  p.rect(X - 12, BOTTOM - 1, 24, 1, STEEL, fade);
  p.glowLine(X - 11, BOTTOM, X + 11, BOTTOM, 3, STEEL, 0.3 * fade);

  for (let i = 0; i < 12; i++) {
    const born = 0.86 + rand(S, i, 4) * 0.24, age = t - born;
    if (age < 0 || age > 0.72) continue;
    const life = age / 0.72, x = X + (rand(S, i, 5) - 0.5) * 20;
    const y = Math.min(-1, Math.round(scanY + age * (10 + rand(S, i, 6) * 16)));
    p.rect(Math.round(x), y, rand(S, i, 7) > 0.72 ? 1 : 1, rand(S, i, 8) > 0.76 ? 2 : 1, i % 5 ? EDGE : WHITE, (1 - life) * fade);
  }
  if (t > 1.08) p.glow(X, scanY, 10, STEEL, 0.16 * fade * (1 - clamp((t - 1.08) / 0.6)));
}
