import { fit, clamp, ease, smooth, lerp, rand, WHITE } from "../../core/index.js";

export const meta = {
  name: "Digital door",
  desc: "A compact vertical sci-fi lock scans, unlocks and retracts upward from a lit sill, leaving a clean empty frame.",
  tags: ["scifi", "door", "digital", "lock", "panel", "one-shot"],
  size: [320, 48],
  origin: [160, 47],
  duration: 1.2,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#101a2a", "#1b3850", "#2d6072", "#478e9c", "#71c4c4", "#b2f0df", "#ffffff"],
    seed: 12,
  },
};

const D = meta.duration, END = D - 1 / meta.fps;
const X = 0, TOP = -34, W = 30, BOTTOM = -1;

export function draw(p, t, o) {
  if (t >= END) return;
  const C = fit(o.palette, 7), S = o.seed, fade = t > 0.94 ? 1 - smooth(0.94, END, t) : 1;
  const scan = clamp(t / 0.34), unlock = clamp((t - 0.23) / 0.27), open = ease.inCubic(clamp((t - 0.45) / 0.46));
  // Lift only as far as the top edge of the fixed 48 px boundary.
  const slide = -open * 13;
  const px0 = X - W / 2, py0 = TOP + slide;

  // Door slab: stepped steel edges, a recessed blue face, and a bright upper scan rim.
  if (open < 1) {
    const edgeFade = fade * (1 - open * 0.25);
    p.rect(px0, py0, W, 1, C[0], edgeFade);
    p.rect(px0, py0 + 1, 1, 32, C[1], edgeFade);
    p.rect(px0 + W - 1, py0 + 1, 1, 32, C[0], edgeFade);
    for (let y = 2; y < 31; y++) {
      const scanY = py0 + y;
      const band = Math.abs(y - scan * 31) < 1.2;
      const edge = y < 3 || y > 28;
      p.line(px0 + 2, scanY, px0 + W - 3, scanY, band ? WHITE : edge ? C[4] : C[2], edgeFade * (band ? 1 : 0.7));
      if (band) p.glowLine(px0 + 2, scanY, px0 + W - 3, scanY, 4, C[5], 0.35 * edgeFade);
    }
    // A split lock glyph: it changes from closed bars to an open gap during unlock.
    const gap = Math.round(unlock * 5);
    for (let y = 10; y < 24; y++) {
      const left = px0 + 8, right = px0 + W - 9;
      if (y < 13 || y > 20 || Math.abs(y - 16) < gap) {
        p.px(left, py0 + y, y === 16 && unlock > 0.7 ? WHITE : C[5], edgeFade);
        p.px(right, py0 + y, y === 16 && unlock > 0.7 ? WHITE : C[5], edgeFade);
      }
    }
    p.rect(px0 + 13, py0 + 14, 5, 5, unlock > 0.72 ? C[5] : C[3], edgeFade);
    p.px(px0 + 15, py0 + 15, unlock > 0.72 ? WHITE : C[6], edgeFade);
    p.glow(X, py0 + 16, 10 + 8 * unlock, C[4], 0.15 * edgeFade);
  }

  // The sill remains anchored as the panel lifts, matching the reference's fixed lower band.
  const sill = fade * (0.35 + 0.65 * clamp((t - 0.12) / 0.28));
  p.rect(X - 16, BOTTOM, 32, 1, C[0], sill);
  p.line(X - 14, BOTTOM - 1, X + 14, BOTTOM - 1, unlock > 0.7 ? WHITE : C[4], sill);
  p.glowLine(X - 13, BOTTOM - 1, X + 13, BOTTOM - 1, 4, C[4], 0.25 * sill);

  // Short digital debris drops from the lock as it releases, all deterministic and bounded.
  const debris = clamp((t - 0.3) / 0.55);
  for (let i = 0; i < 14; i++) {
    const a = rand(S, i, 4), born = rand(S, i, 5) * 0.18, age = t - 0.3 - born;
    if (age < 0 || age > 0.55) continue;
    const x = X + (a - 0.5) * 27, y = py0 + 20 + age * (18 + rand(S, i, 6) * 24);
    p.px(x, y, i % 5 === 0 ? WHITE : C[5], (1 - age / 0.55) * debris * fade);
  }

  if (unlock > 0.55 && t < 0.65) p.glow(X, py0 + 16, 18, WHITE, (unlock - 0.55) * 0.25 * fade);
}

