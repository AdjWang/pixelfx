import { fit, rng, bolt, clamp, ease, lerp, smooth, TAU, WHITE } from "../../core/index.js";
import { strokeArc } from "./_lib.js";

export const meta = {
  name: "Electric flash",
  desc: "A sci-fi burst built from expanding energy rings, clear white-cored electric lines and drifting point particles that ease out to nothing.",
  tags: ["scifi", "flash", "electric", "ring", "particles", "one-shot"],
  size: [64, 64],
  origin: [32, 32],
  duration: 47 / 60,
  loop: false,
  fps: 60,
  bg: "dark",
  options: {
    palette: ["#17162b", "#3b2850", "#76503e", "#c47b35", "#f0b84b", "#ffe78a", "#ffffff"],
    seed: 18,
  },
};

const D = meta.duration;
const END = D - 1 / meta.fps;
const CY = 0;
const since = (t, at) => (((t - at) % D) + D) % D;
const burst = (t, at, life) => {
  const a = since(t, at);
  return a < life ? 1 - ease.outCubic(a / life) : 0;
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7);
  if (t >= END) return;
  const frame = Math.floor(t * meta.fps);
  const R = rng(o.seed, frame, 91);
  const fade = t > 0.9 ? 1 - smooth(0.9, END, t) : 1;

  // Layer 1: one expanding energy ring with a hot leading edge and a fading halo.
  for (const [at, life, maxR] of [[0.03, 0.46, 27]]) {
    const k = burst(t, at, life) * fade;
    if (k <= 0.01) continue;
    const r = lerp(4, maxR, ease.outExpo(1 - k));
    const w = Math.max(1, 1 + 2.4 * k);
    p.ring(0, CY, r, w, k > 0.7 ? WHITE : C[5], 0.45 * k);
    p.glowRing(0, CY, r, 5 + 4 * k, C[4], 0.28 * k);
  }

  // Layer 2: seeded electric lines. Their endpoints orbit the center, while their paths redraw per frame.
  const intensity = burst(t, 0.03, 0.3) * fade;
  const lineIntensity = burst(t, 0.03, 0.46) * fade;
  const count = 3 + Math.floor(lineIntensity * 4);
  for (let i = 0; lineIntensity > 0.01 && i < count; i++) {
    const a = (i / count) * TAU + t * (i & 1 ? -0.8 : 0.65) + R.range(-0.28, 0.28);
    const reach = R.range(14, 27) * (0.72 + lineIntensity * 0.28);
    const sx = Math.cos(a) * R.range(3, 7), sy = CY + Math.sin(a) * R.range(3, 7);
    const ex = Math.cos(a) * reach, ey = CY + Math.sin(a) * reach;
    const path = bolt(R, sx, sy, ex, ey, { jag: 0.3, depth: 3 });
    // Match EMP blast's readable arc: a dark halo, colored body, and white-hot fresh core.
    strokeArc(p, path, [C[1], C[4], C[5]], lineIntensity, 0.85);
    p.glow(ex, ey, 4 + lineIntensity * 4, C[5], lineIntensity * (0.16 + lineIntensity * 0.2));
  }

  // Layer 3: point particles orbit, drift outward and blink on a 72-frame cycle.
  for (let i = 0; i < 22; i++) {
    const PR = rng(o.seed, i, 401), phase = PR.range(0.02, 0.34), age = t - phase, life = PR.range(0.22, 0.5), k = clamp(age / life);
    if (age < 0 || k >= 1) continue;
    const a = PR.range(0, TAU) + age * PR.range(-1.4, 1.4);
    const d = PR.range(7, 29) * (0.25 + ease.outCubic(k) * 0.85);
    const x = Math.cos(a) * d, y = CY + Math.sin(a) * d;
    const c = (i + frame) % 9 === 0 ? WHITE : k < 0.18 ? C[6] : C[5];
    const alpha = Math.min(1, (1 - k) * 2.2) * (0.45 + intensity * 0.55) * fade;
    p.px(x, y, c, alpha);
    if (alpha > 0.45 && (i & 2) === 0) p.glow(x, y, 3, C[4], alpha * 0.22);
  }

  // The center is deliberately only light: there is no icon or solid emblem under these layers.
  const core = Math.max(intensity, 0.12 * (0.5 + 0.5 * Math.sin(t * TAU * 3))) * fade;
  p.glow(0, CY, 7 + core * 8, C[4], (0.12 + core * 0.22) * fade);
  if (core > 0.7) p.glow(0, CY, 3, WHITE, 0.24 * core);
}

