import { fit, TAU } from "../../core/index.js";

export const meta = {
  name: "Empty energy container",
  desc: "An empty compact reactor container with translucent glass, a steel base and cap, and a quiet internal light.",
  tags: ["scifi", "reactor", "container", "glass", "empty", "prop", "loop"],
  size: [32, 64], origin: [16, 58], duration: 2.4, loop: true, fps: 30, bg: "ground",
  options: {
    palette: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
    metal: ["#0e0d14", "#1e1c27", "#312e3e", "#4b4759", "#6f6a82", "#9d98b0"], seed: 35,
  },
};

const D = meta.duration, TOPY = -39, BOTY = -6, RC = 10;
// Adjust from 0 (invisible) to 1 (current glass strength).
const GLASS_ALPHA = 1;

function hoop(p, y, H, C, near) {
  for (let i = 0, n = Math.ceil(RC * 8); i < n; i++) {
    const a = (i / n) * TAU, s = Math.sin(a);
    if (s >= 0 !== near) continue;
    const x = Math.cos(a) * RC, yy = y + s * 1.2;
    p.px(x, yy, near ? (s > 0.6 ? H[4] : H[3]) : H[1]);
    if (near && s < 0.3) p.px(x, yy - 1, C[3]);
  }
}

function plinth(p, C, H) {
  p.shade(-6, -4, 6, 1, (x, y, out) => {
    const top = (x / 5.8) ** 2 + ((y + 2.8) / 1.2) ** 2 <= 1, side = Math.abs(x) <= 6 && y > -3 && y <= 0;
    if (!top && !side) return;
    out.c = top ? (Math.abs(x) > 5 ? H[0] : H[3]) : (Math.abs(x) > 5 || y === 0 ? H[0] : H[2]);
  });
  for (let x = -4; x <= 4; x += 4) p.px(x, -1, C[5]);
  p.glow(0, -3, 7, C[4], 0.28);
}

function cap(p, C, H) {
  p.shade(-4, TOPY - 3, 4, TOPY, (x, y, out) => {
    const d = (x / 3.8) ** 2 + ((y - TOPY) / 1.7) ** 2;
    if (d <= 1) out.c = d > 0.8 ? H[0] : H[3];
  });
  p.px(0, TOPY - 3, C[6]);
  p.glow(0, TOPY - 3, 3, C[4], 0.34);
}

function glass(p, C, pulse) {
  const gy = (TOPY + BOTY) * 0.5, gh = (BOTY - TOPY) * 0.5;
  for (let y = Math.ceil(TOPY + 1); y <= Math.floor(BOTY - 1); y++) for (let x = -11; x <= 11; x++) {
    const q = (x / 11) ** 2 + ((y - gy) / gh) ** 2;
    if (q >= 1) continue;
    const rim = Math.pow(q, 3);
    p.blend(x + 0.5, y + 0.5, q > 0.72 ? C[3] : C[2], GLASS_ALPHA * (0.08 + 0.14 * rim + 0.04 * pulse));
    if (Math.abs(x) < 2 && (y & 2) === 0) p.blend(x + 0.5, y + 0.5, C[5], GLASS_ALPHA * (0.08 + 0.04 * pulse));
  }
  p.glow(0, gy, 13, C[3], 0.16 + 0.08 * pulse);
}

export function drawBack(p, t, o) {
  const C = fit(o.palette, 8), H = fit(o.metal, 6), pulse = 0.5 + 0.5 * Math.sin((t / D) * TAU * 2);
  glass(p, C, pulse);
  hoop(p, BOTY, H, C, false);
  hoop(p, TOPY, H, C, false);
}

export function draw(p, t, o) {
  const C = fit(o.palette, 8), H = fit(o.metal, 6), pulse = 0.5 + 0.5 * Math.sin((t / D) * TAU * 2);
  plinth(p, C, H);
  hoop(p, BOTY, H, C, true);
  hoop(p, TOPY, H, C, true);
  cap(p, C, H);
  p.glow(0, (TOPY + BOTY) * 0.5, 12, C[4], 0.18 + 0.1 * pulse);
}

