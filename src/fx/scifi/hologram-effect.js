import { fit, cycle, lerp, rand, hex, TAU, WHITE } from "../../core/index.js";

export const meta = {
  name: "Hologram effect",
  desc: "A floor projector throws a cone of light with scanlines, data rings, glitches and rising signal fragments; no model or board remains.",
  tags: ["scifi", "hologram", "projector", "scanline", "glitch", "ground", "loop"],
  size: [32, 32], origin: [16, 30], duration: 4, loop: true, fps: 30, bg: "ground",
  options: {
    palette: ["#050c1e", "#0a1f48", "#123b80", "#1d64b8", "#2e98e8", "#6cd0ff", "#c8f0ff", "#ffffff"],
    metal: ["#0e0d14", "#1e1c27", "#312e3e", "#4b4759", "#6f6a82", "#9d98b0"],
    split: "#ff4fd8", seed: 21,
  },
};

const D = meta.duration, OY = -25, RAD = 8, LENS = -3;
const GLITCHES = [[0.92, 0.12, 1], [2.55, 0.2, 1.4], [3.42, 0.06, 0.7]];

export function draw(p, t, o) {
  const C = fit(o.palette, 8), H = fit(o.metal, 6), SPLIT = hex(o.split), S = o.seed, ph = t / D, frame = Math.floor(t * 30);
  const gl = GLITCHES.reduce((m, [g0, len, k]) => (t >= g0 && t < g0 + len ? Math.max(m, k) : m), 0);
  const flick = gl > 0 && rand(S, frame) < 0.5 ? 1 : 0;
  const cy = OY + 1.5 * Math.sin(TAU * ph * 2);
  const tears = [];
  if (gl) for (let i = 0; i < 2; i++) tears.push([Math.floor(cy - RAD + rand(S, frame, i) * RAD * 2), 2 + Math.floor(rand(S, frame, i, 1) * 4), Math.round((rand(S, frame, i, 2) - 0.5) * 10 * gl)]);
  const tearAt = (y) => { for (const [y0, h, dx] of tears) if (y >= y0 && y < y0 + h) return dx; return 0; };
  const put = (x, y, c, a = 1) => {
    const yy = Math.floor(y); if (flick && (yy & 1)) return;
    const dx = tearAt(yy), draw = (xx, cc, aa) => { if (xx >= -16 && xx < 16 && y >= -30 && y < 2) p.dot(xx, y, cc, aa); };
    if (dx) { draw(x + dx, SPLIT, a * 0.8); draw(x + dx + Math.sign(dx), c, a); } else draw(x, c, a);
  };

  // Projector body and lens, unchanged from the original hologram.
  p.shade(-8, -4, 8, 1, (x, y, out) => {
    const top = (x / 7.5) ** 2 + ((y + 2.5) / 1.5) ** 2 <= 1, side = Math.abs(x) <= 7.5 && y > -2.5 && y <= 0;
    if (!top && !side) return;
    if (top) out.c = (x / 7.5) ** 2 + ((y + 2.5) / 1.5) ** 2 > 0.8 ? H[0] : y < -3 ? H[5] : H[3];
    else out.c = Math.abs(x) > 7 || y === 0 ? H[0] : y === -2 ? H[4] : x < -3 ? H[3] : x > 3 ? H[1] : H[2];
  });
  p.ellipse(0, LENS + 0.25, 2.75, 0.8, (d) => (d < 0.4 ? WHITE : d < 0.8 ? C[6] : C[4]));
  for (let i = 0; i < 4; i++) { const k = 0.5 + 0.5 * Math.cos(TAU * (2 * ph - i / 4)); p.px(-4.5 + i * 3, -1, k > 0.7 ? C[6] : C[3]); }

  // The cone and its scanlines remain the hologram's main volume.
  const top = cy + RAD * 1.3;
  for (let y = Math.ceil(top); y < LENS; y++) {
    const v = (y - LENS) / (top - LENS), w = lerp(2, RAD + 2, v);
    const lineOn = ((((y + t * 24) % 3) + 3) % 3) < 1;
    for (let x = Math.floor(-w); x <= Math.ceil(w); x++) {
      const q = Math.abs(x + 0.5) / w; if (q > 1) continue;
      p.blend(x + 0.5, y + 0.5, lineOn ? C[5] : C[4], (0.05 + 0.12 * (1 - v)) * (1 - 0.6 * q * q) + (lineOn ? 0.06 : 0));
    }
  }
  p.glow(0, LENS, 6, C[5], 0.6);

  // Empty holographic stage: no crystal/model or circular cone ring, only rising signal fragments.
  p.glowLine(-RAD - 2, top, RAD + 2, top, 2, C[4], 0.2);
  cycle(t, D, 18, S + 1, (r) => r.range(0.8, 1.4), (age, life, r) => {
    const k = age / life, y = lerp(LENS - 1, top, k), w = lerp(2, RAD + 1, k);
    put(r.range(-0.8, 0.8) * w, y, r.chance(0.3) ? WHITE : C[5], Math.min(1, (1 - k) * 2));
  });

  p.glow(0, -1, 11, C[4], 0.2);
}

