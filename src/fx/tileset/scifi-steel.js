import { fit, clamp, smooth, tileNoise, TAU, WHITE, hex } from "../../core/index.js";

// Five compatible 16x16 autotile pieces laid out left-to-right:
// center, left edge, right edge, top cap, bottom cap.
export const meta = {
  name: "Sci-fi steel autotile",
  desc: "A five-piece sci-fi platform tileset with shared bevels, segmented circuitry and a moving energy scan.",
  tags: ["tileset", "platform", "scifi", "autotile", "metal", "loop"],
  size: [80, 16],
  origin: [40, 8],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#07131c", "#102832", "#174653", "#277181", "#45c3c5", "#9af5e7", "#ffffff"],
    seed: 44,
  },
};

const D = meta.duration;
const X0 = -40, Y0 = -8, TILE = 16;
const INK = hex("#07131c");

function tile(p, x, y, kind, C, light, ph, seed) {
  const left = x, top = y, right = x + 16, bottom = y + 16;
  const pulse = 0.58 + 0.42 * Math.sin(TAU * ph + kind * 0.9);
  const scan = ((ph * 22 + kind * 3) % 16 + 16) % 16;

  // Shared tile body: dark core, two-step bevel and a bright powered edge.
  p.rect(left, top, 16, 16, C[1]);
  p.rect(left + 1, top + 1, 14, 14, C[2]);
  p.rect(left + 2, top + 2, 12, 12, C[1]);
  p.rect(left + 3, top + 3, 10, 10, INK);

  // Keep the five pieces edge-compatible: only the exposed side gets a cap.
  if (kind !== 1) p.rect(left, top + 2, 2, 12, C[3]);
  if (kind !== 2) p.rect(right - 2, top + 2, 2, 12, C[0]);
  if (kind !== 4) p.rect(left + 2, top, 12, 2, C[4]);
  if (kind !== 3) p.rect(left + 2, bottom - 2, 12, 2, C[0]);

  // The cap pieces get a strong structural lip; center/edge pieces retain a recessed face.
  if (kind === 3) {
    p.rect(left + 1, top, 14, 3, C[4]);
    p.line(left + 3, top + 3, right - 4, top + 3, C[5], 0.85);
  }
  if (kind === 4) {
    p.rect(left + 1, bottom - 3, 14, 3, C[2]);
    p.line(left + 3, bottom - 3, right - 4, bottom - 3, C[4], 0.9);
  }

  // Segmented circuit motif, mirrored so neighboring tiles do not form a noisy grid.
  const lane = 5 + (kind % 3) * 2;
  p.line(left + 4, top + lane, left + 8, top + lane, C[3], 0.85);
  p.line(left + 8, top + lane, left + 8, top + lane + 2, C[3], 0.85);
  p.line(left + 8, top + lane + 2, left + 11, top + lane + 2, C[4], 0.9);
  p.px(left + (kind & 1 ? 11 : 4), top + lane, pulse > 0.68 ? C[5] : C[3]);

  // A single moving scan pixel and its light, giving the atlas life without changing its silhouette.
  const sy = top + Math.floor(scan);
  if (sy > top + 3 && sy < bottom - 3) {
    p.line(left + 3, sy, right - 3, sy, C[5], 0.42 + pulse * 0.38);
    p.glowLine(left + 4, sy, right - 4, sy, 3, C[4], 0.12 + pulse * 0.1);
  }

  // Sparse deterministic status pixels keep the surface from reading as a flat rectangle.
  for (let i = 0; i < 3; i++) {
    const n = tileNoise((left + i * 7) * 0.4, (top + i * 5) * 0.5 + ph * 8, 8, 0, seed + kind * 13 + i);
    if (n > 0.56) p.px(left + 4 + i * 3, top + 11 - (i & 1), n > 0.72 ? WHITE : C[4], 0.55 + 0.35 * pulse);
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette, 7), ph = (t / D) % 1, seed = o.seed;
  for (let i = 0; i < 5; i++) tile(p, X0 + i * TILE, Y0, i, C, C[4], ph, seed);
}
