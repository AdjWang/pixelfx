import { clamp, ease, smooth, lerp, rand, hex, WHITE } from "../../core/index.js";

export const meta = {
  name: "Digital door",
  desc: "A solid steel sci-fi door is written by one sweeping scan, then fades cleanly into a few falling signal fragments.",
  tags: ["scifi", "door", "digital", "scan", "one-shot"],
  size: [64, 96],
  origin: [32, 91],
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
const X = 0, TOP = -84, BOTTOM = -8, W = 48, H = BOTTOM - TOP;
const STEEL = hex("#b0bec5"), EDGE = hex("#607d8b"), DEEP = hex("#263238");

export function draw(p, t, o) {
  if (t >= END) return;
  const S = o.seed, fade = t > 1.28 ? 1 - smooth(1.28, END, t) : 1;
  const scanK = ease.inOutSine(clamp((t - 0.08) / 0.9));
  const scanY = lerp(BOTTOM - 3, TOP + 3, scanK);
  const bodyTop = TOP;
  const left = X - W / 2, right = X + W / 2;

  // A single opaque steel face: stepped frame, no grid or translucent fill.
  p.rect(left + 2, bodyTop, W - 4, H, STEEL, fade);
  p.rect(left, bodyTop + 3, 2, H - 6, DEEP, fade);
  p.rect(right - 2, bodyTop + 3, 2, H - 6, DEEP, fade);
  p.rect(left + 2, bodyTop, W - 4, 3, EDGE, fade);
  p.rect(left + 2, BOTTOM - 3, W - 4, 3, EDGE, fade);
  p.rect(left + 6, bodyTop + 5, 2, H - 10, EDGE, fade);
  p.rect(right - 8, bodyTop + 5, 2, H - 10, EDGE, fade);

  // One bright scan band sweeps through the uninterrupted door face.
  if (t >= 0.08 && t < 1.24) {
    const sy = Math.round(scanY);
    p.rect(left + 4, sy - 1, W - 8, 3, WHITE, fade);
    p.glowLine(left + 4, sy, right - 4, sy, 8, STEEL, 0.42 * fade);
    p.line(left + 4, sy + 2, right - 4, sy + 2, EDGE, 0.9 * fade);
  }

  p.rect(X - 27, BOTTOM, 54, 3, DEEP, fade);
  p.rect(X - 23, BOTTOM - 2, 46, 2, STEEL, fade);
  p.glowLine(X - 22, BOTTOM - 1, X + 22, BOTTOM - 1, 5, STEEL, 0.3 * fade);

  for (let i = 0; i < 18; i++) {
    const born = 0.86 + rand(S, i, 4) * 0.24, age = t - born;
    if (age < 0 || age > 0.72) continue;
    const life = age / 0.72, x = X + (rand(S, i, 5) - 0.5) * 39;
    const y = Math.min(-1, Math.round(scanY + age * (18 + rand(S, i, 6) * 28)));
    p.rect(Math.round(x), y, rand(S, i, 7) > 0.72 ? 2 : 1, rand(S, i, 8) > 0.76 ? 2 : 1, i % 5 ? EDGE : WHITE, (1 - life) * fade);
  }
  if (t > 1.08) p.glow(X, scanY, 20, STEEL, 0.16 * fade * (1 - clamp((t - 1.08) / 0.6)));
}

