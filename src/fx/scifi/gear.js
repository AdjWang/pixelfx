import { P, Rng, fit, bolt, forks, hex, TAU, WHITE } from "../../core/index.js";
import { Ghosts, since, strokeArc } from "./_lib.js";

export const meta = {
  name: "Gear",
  desc: "A rotating gear with a white rim floats inside orbit rings while electric arcs, sparks, motes and pulsing light flare around it.",
  tags: ["scifi", "reactor", "gear", "core", "power", "machine", "loop"],
  size: [32, 64], origin: [16, 58], duration: 2.4, loop: true, fps: 30, bg: "ground",
  options: {
    palette: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
    seed: 35,
  },
};

const D = meta.duration, CY = -22, R0 = 6.4, SLOT = 0.1, NS = Math.round(D / SLOT);
const BEATS = [[0.05, 1, true], [0.25, 0.5, false], [1.25, 1, true], [1.45, 0.5, false]];
const env = (a) => (a < 0.03 ? a / 0.03 : Math.exp(-(a - 0.03) / 0.12));
const pulseAt = (t) => BEATS.reduce((m, [b, k]) => Math.max(m, k * env(since(t, b, D))), 0);
const NODES = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * TAU; return { x: Math.cos(a) * 13, y: CY + Math.sin(a) * 13 }; });
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
      const node = rn.pick(NODES), ang = Math.atan2(node.y - CY, node.x);
      const sx = Math.cos(ang) * R0, sy = CY + Math.sin(ang) * R0, path = bolt(rn, sx, sy, node.x, node.y, { jag: 0.3, depth: 2 });
      arcs.push({ s, path, fk: forks(rn, path, { count: rn.int(0, 1), len: 2.5, jag: 0.35 }) });
      for (let i = 0; i < 2; i++) { const a = Math.atan2(node.y - sy, node.x - sx) + Math.PI + rn.range(-1.2, 1.2), sp = rn.range(35, 90); g.add(ts, P.SPARK, node.x, node.y, Math.cos(a) * sp, Math.sin(a) * sp - 20, rn.range(0.2, 0.5)); }
    }
  }
  for (const [b, , strong] of BEATS) if (strong) for (let i = 0; i < 5; i++) { const a = rn.range(0, TAU), sp = rn.range(20, 55); g.add(b + 0.02, P.MOTE, Math.cos(a) * R0, CY + Math.sin(a) * R0, Math.cos(a) * sp, Math.sin(a) * sp, rn.range(0.25, 0.5), rn.pick([WHITE, C[6], C[5]]), 0.7); }
  const v = { C, arcs, g }; cache.set(key, v); return v;
}

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
  const { C } = setup(o), pulse = pulseAt(t);
  for (const rg of RINGS) ring(p, t, rg, C, false, pulse);
}

export function draw(p, t, o) {
  const { C, arcs, g } = setup(o), pulse = pulseAt(t);
  gear(p, t, C, pulse); for (const rg of RINGS) ring(p, t, rg, C, true, pulse);
  const s = Math.floor(t / SLOT) % NS, k = 1 - (t - Math.floor(t / SLOT) * SLOT) / SLOT; for (const a of arcs) if (a.s === s) { strokeArc(p, a.path, [C[2], C[5], C[4]], k); for (const f of a.fk) strokeArc(p, f, [C[2], C[5], C[4]], k, 0.6); const [ex, ey] = a.path[a.path.length - 1]; p.glow(ex, ey, 3, C[5], 0.6 * k); }
  g.at(t).draw(p); p.glow(0, CY, 11, C[4], 0.2 + 0.3 * pulse); p.glow(0, CY, 4, WHITE, 0.35 + 0.4 * pulse);
}

