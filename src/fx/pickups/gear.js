import { fit, hex, rand, TAU, WHITE, lerp } from "../../core/index.js";

export const meta = {
  name: "Gear pickup",
  desc: "A machined gear hovers over its pickup shadow while a cool ring, rotating rays and orbiting sparks build its energy.",
  tags: ["pickup", "gear", "machine", "collectible", "loop"],
  size: [64, 64],
  origin: [32, 54],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#08131b", "#123545", "#1e6172", "#2d9ca5", "#62d6ce", "#b7fff0", "#ffffff"], seed: 23 },
};

// Exact 12x12 silhouette and original colors from the reference gear. Effects are drawn around it only.
const GEAR = [
  "................",
  "................",
  "......kkkk......",
  "....kkkggkkk....",
  "...kggkgggk....",
  "...kgggggggk....",
  "..kkggkkggkk...",
  "..kgggk..kggk..",
  "..kgggk..kggk..",
  "...kkggkkggkk...",
  "...kgggggggk....",
  "...kkkggkkk....",
  "....kkkggkkk....",
  "......kkkk......",
  "................",
  "................",
];
const GEAR_PAL = { k: hex("#000000"), g: hex("#455a64") };
const CY = -24, RING = 14;

export function drawBack(p, t, o) {
  const C = fit(o.palette, 7), ph = t / meta.duration, hover = CY + Math.sin(ph * TAU) * 1.4;
  // A small contact shadow and the low half of the pickup ring sit behind the gear.
  p.ellipse(0, -1, 13, 2.5, C[0], 0.5);
  p.glow(0, -1, 18, C[2], 0.14);
  const pulse = 0.5 + 0.5 * Math.sin(ph * TAU * 2 - 0.6);
  p.arc(0, hover, RING + 1.5 * pulse, 1, Math.PI * 0.08, Math.PI * 0.92, C[3], 0.45 + pulse * 0.3);
}

export function draw(p, t, o) {
  const C = fit(o.palette, 7), ph = t / meta.duration, hover = CY + Math.sin(ph * TAU) * 1.4;
  const pulse = 0.5 + 0.5 * Math.sin(ph * TAU * 2 - 0.6);
  const flash = Math.max(0, Math.sin(ph * TAU * 2)) ** 8;

  // The reference gear itself is unchanged: same pixels and the same two colors every frame.
  p.sprite(GEAR, GEAR_PAL, -8, Math.round(hover - 8));

  // Thin pickup halo and rotating rays provide all animation around the preserved sprite.
  p.glowRing(0, hover, RING + pulse * 2, 5, C[3], 0.18 + pulse * 0.18);
  p.glow(0, hover, 10 + pulse * 3, C[3], 0.12 + pulse * 0.14);
  for (let i = 0; i < 8; i++) {
    const a = ph * TAU * 0.5 + (i * TAU) / 8, inner = 17, outer = inner + (i & 1 ? 4 : 7) * (0.75 + 0.25 * pulse);
    const x0 = Math.cos(a) * inner, y0 = hover + Math.sin(a) * inner * 0.7;
    const x1 = Math.cos(a) * outer, y1 = hover + Math.sin(a) * outer * 0.7;
    p.line(x0, y0, x1, y1, i % 3 === 0 && flash > 0.5 ? WHITE : C[4], 0.25 + 0.3 * pulse);
  }

  // Deterministic motes travel around the ring, with short glints on the pickup beat.
  for (let i = 0; i < 18; i++) {
    const a = ph * TAU * (0.7 + (i & 1) * 0.25) + rand(o.seed, i, 2) * TAU;
    const d = lerp(17, 26, rand(o.seed, i, 3));
    const x = Math.cos(a) * d, y = hover + Math.sin(a) * d * 0.7;
    const k = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(ph * TAU * 2 + i * 1.7));
    p.px(x, y, k > 0.82 ? WHITE : C[5], k * 0.8);
    if (k > 0.7) p.glow(x, y, 3, C[4], 0.2 * k);
  }
}

