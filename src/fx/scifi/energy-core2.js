import { P, Rng, fit, bolt, forks, clamp, lerp, rng, hex, TAU, WHITE } from "../../core/index.js";
import { Ghosts, since, strokeArc } from "./_lib.js";

export const meta = {
  name: "Energy core gear",
  desc: "A narrow steel cage holds a rotating gear with a white rim; orbit rings, arcs, motes, status lights and the cap remain active without the expanding shock ring.",
  tags: ["scifi", "reactor", "gear", "core", "power", "machine", "loop"],
  size: [32, 64], origin: [16, 58], duration: 2.4, loop: true, fps: 30, bg: "ground",
  options: {
    palette: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
    metal: ["#0e0d14", "#1e1c27", "#312e3e", "#4b4759", "#6f6a82", "#9d98b0"], seed: 35,
  },
};

const D = meta.duration, CY = -22, R0 = 6.4, RC = 10, TOPY = -39, BOTY = -6, SLOT = 0.1, NS = Math.round(D / SLOT);
const BEATS = [[0.05, 1, true], [0.25, 0.5, false], [1.25, 1, true], [1.45, 0.5, false]];
const env = (a) => (a < 0.03 ? a / 0.03 : Math.exp(-(a - 0.03) / 0.12));
const pulseAt = (t) => BEATS.reduce((m, [b, k]) => Math.max(m, k * env(since(t, b, D))), 0);
const BARS = Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU + Math.PI / 6; return { x: RC * Math.sin(a), z: Math.cos(a) }; });
const RINGS = [{ r: 8.4, tilt: 1.15, spin: (t) => TAU * (t / D) }, { r: 10, tilt: -0.9, spin: (t) => -TAU * 2 * (t / D) + 1 }];
function ringPt(r, tilt, spin, a) { const x = r * Math.cos(a), z0 = r * Math.sin(a), y = -z0 * Math.sin(tilt), z = z0 * Math.cos(tilt); return [x * Math.cos(spin) + z * Math.sin(spin), CY - y, -x * Math.sin(spin) + z * Math.cos(spin)]; }

const cache = new Map();
function setup(o) {
  const key = `${o.seed}:${o.palette.join()}`; if (cache.has(key)) return cache.get(key);
  const C = fit(o.palette, 8), rn = new Rng(o.seed), g = new Ghosts(D, { ground: () => 0, sparks: [WHITE, C[6], C[5], C[4]], haze: C[5], box: [-16, -58, 16, 4] }), arcs = [];
  for (let s = 0; s < NS; s++) {
    const ts = s * SLOT, hot = BEATS.some(([b, , strong]) => strong && since(ts, b, D) < 0.16);
    for (let n = 0; n < (hot ? 2 : 1); n++) {
      if (!hot && !rn.chance(0.4)) continue;
      const bar = rn.pick(BARS.filter((b) => b.z > -0.2)), ty = rn.range(TOPY + 3, BOTY - 2), ang = Math.atan2(ty - CY, bar.x);
      const sx = Math.cos(ang) * R0, sy = CY + Math.sin(ang) * R0, path = bolt(rn, sx, sy, bar.x - Math.sign(bar.x), ty, { jag: 0.3, depth: 2 });
      arcs.push({ s, path, fk: forks(rn, path, { count: rn.int(0, 1), len: 2.5, jag: 0.35 }) });
      for (let i = 0; i < 2; i++) { const a = Math.atan2(ty - sy, bar.x - sx) + Math.PI + rn.range(-1.2, 1.2), sp = rn.range(35, 90); g.add(ts, P.SPARK, bar.x, ty, Math.cos(a) * sp, Math.sin(a) * sp - 20, rn.range(0.2, 0.5)); }
    }
  }
  for (const [b, , strong] of BEATS) if (strong) for (let i = 0; i < 5; i++) { const a = rn.range(0, TAU), sp = rn.range(20, 55); g.add(b + 0.02, P.MOTE, Math.cos(a) * R0, CY + Math.sin(a) * R0, Math.cos(a) * sp, Math.sin(a) * sp, rn.range(0.25, 0.5), rn.pick([WHITE, C[6], C[5]]), 0.7); }
  const v = { C, arcs, g }; cache.set(key, v); return v;
}

function plinth(p, C, H, t, pulse) {
  p.shade(-6, -4, 6, 1, (x, y, out) => { const top = (x / 5.8) ** 2 + ((y + 2.8) / 1.2) ** 2 <= 1, side = Math.abs(x) <= 6 && y > -3 && y <= 0; if (!top && !side) return; out.c = top ? (Math.abs(x) > 5 ? H[0] : H[3]) : (Math.abs(x) > 5 || y === 0 ? H[0] : H[2]); });
  for (let i = 0; i < 3; i++) { const x = -4 + i * 4, k = 0.5 + 0.5 * Math.cos(TAU * (2 * (t / D) - i / 3)); p.px(x, -1, k > 0.7 ? WHITE : k > 0.4 ? C[5] : C[2]); if (k > 0.6) p.glow(x, -1, 2, C[4], 0.3 * k); }
  p.glow(0, -3, 7, C[4], 0.25 + 0.3 * pulse);
}

function barDraw(p, b, C, H, pulse, back) { const lit = back ? C[3] : pulse > 0.5 ? C[6] : C[5], inward = -Math.sign(b.x); for (let y = TOPY + 1; y < BOTY; y++) for (let i = -1; i <= 1; i++) p.px(b.x + i, y, back ? (i === inward ? lit : H[1]) : i === inward ? lit : i === 0 ? H[3] : H[1]); }
function hoop(p, y, rx, H, C, near, pulse) { for (let i = 0, n = Math.ceil(rx * 8); i < n; i++) { const g = (i / n) * TAU, s = Math.sin(g); if (s >= 0 !== near) continue; const x = Math.cos(g) * rx, yy = y + s * 1.2; p.px(x, yy, near ? (s > 0.6 ? H[4] : H[3]) : H[1]); if (near && s < 0.3) p.px(x, yy - 1, pulse > 0.5 ? C[5] : C[3]); } }

function gear(p, t, C, pulse) {
  // Exact second 16x16 reference tile: white rim (153) and slate gear fill (149).
  const rows = [
    "................", "................", "......wwww......", "....wwwggwww....",
    "...wggwggwggw...", "...wgggggggw....", "..wwwggwwggwww..", "..wggw..wgggw...",
    "..wggw..wgggw...", "...wwggwwggww...", "...wgggggggw....", "...wggwggwggw...",
    "....wwwggwww....", "......wwww......", "................", "................",
  ];
  const GEAR_GRAY = hex("#455a64");
  const spin = (t / D) * TAU, cs = Math.cos(spin), sn = Math.sin(spin);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (rows[y][x] !== ".") {
    const qx = x - 7.5, qy = y - 7.5;
    const rx = qx * cs - qy * sn, ry = qx * sn + qy * cs;
    p.px(Math.round(rx), CY + Math.round(ry), WHITE);
  }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (rows[y][x] === "g") {
    const qx = x - 7.5, qy = y - 7.5;
    const rx = qx * cs - qy * sn, ry = qx * sn + qy * cs;
    p.px(Math.round(rx), CY + Math.round(ry), GEAR_GRAY);
  }
  p.glow(0, CY, 9, C[4], 0.25 + 0.25 * pulse);
}

function ring(p, t, rg, C, front, pulse) { const spin = rg.spin(t), bead = (t / D) * TAU * 3; for (let i = 0, n = Math.ceil(rg.r * 9); i < n; i++) { const a = (i / n) * TAU, [x, y, z] = ringPt(rg.r, rg.tilt, spin, a); if (z >= 0 !== front) continue; const u = ((((a - bead) / TAU) % 1) + 1) % 1; p.px(x, y, u > 0.9 ? WHITE : !front ? C[3] : z > 0.5 * rg.r || pulse > 0.6 ? C[6] : C[5]); } if (front) { const [x, y] = ringPt(rg.r, rg.tilt, spin, bead); p.glow(x, y, 3, C[5], 0.5); } }

export function drawBack(p, t, o) {
  const { C } = setup(o), H = fit(o.metal, 6), pulse = pulseAt(t), gy = (TOPY + BOTY) * 0.5, gh = (BOTY - TOPY) * 0.5;
  // A faint glass capsule sits behind the machinery; it has no hard border of its own.
  for (let y = Math.ceil(TOPY + 1); y <= Math.floor(BOTY - 1); y++) for (let x = -11; x <= 11; x++) {
    const q = (x / 11) ** 2 + ((y - gy) / gh) ** 2;
    if (q >= 1) continue;
    const rim = Math.pow(q, 3), a = 0.08 + 0.14 * rim + 0.04 * pulse;
    p.blend(x + 0.5, y + 0.5, q > 0.72 ? C[3] : C[2], a);
    if (Math.abs(x) < 2 && (y & 2) === 0) p.blend(x + 0.5, y + 0.5, C[5], 0.08 + 0.04 * pulse);
  }
  p.glow(0, gy, 13, C[3], 0.16 + 0.08 * pulse);
  hoop(p, BOTY, RC, H, C, false, pulse); hoop(p, TOPY, RC, H, C, false, pulse); for (const rg of RINGS) ring(p, t, rg, C, false, pulse);
}

export function draw(p, t, o) {
  const { C, arcs, g } = setup(o), H = fit(o.metal, 6), pulse = pulseAt(t);
  plinth(p, C, H, t, pulse);
  gear(p, t, C, pulse); for (const rg of RINGS) ring(p, t, rg, C, true, pulse); hoop(p, BOTY, RC, H, C, true, pulse); hoop(p, TOPY, RC, H, C, true, pulse);
  p.shade(-4, TOPY - 3, 4, TOPY, (x, y, out) => { const d = (x / 3.8) ** 2 + ((y - TOPY) / 1.7) ** 2; if (d <= 1) out.c = d > 0.8 ? H[0] : H[3]; }); p.px(0, TOPY - 3, pulse > 0.4 ? WHITE : C[5]); p.glow(0, TOPY - 3, 2.5, C[4], 0.4 + 0.4 * pulse);
  const s = Math.floor(t / SLOT) % NS, k = 1 - (t - Math.floor(t / SLOT) * SLOT) / SLOT; for (const a of arcs) if (a.s === s) { strokeArc(p, a.path, [C[2], C[5], C[4]], k); for (const f of a.fk) strokeArc(p, f, [C[2], C[5], C[4]], k, 0.6); const [ex, ey] = a.path[a.path.length - 1]; p.glow(ex, ey, 3, C[5], 0.6 * k); }
  g.at(t).draw(p); p.glow(0, CY, 11, C[4], 0.2 + 0.3 * pulse); p.glow(0, CY, 4, WHITE, 0.35 + 0.4 * pulse);
}

