#!/usr/bin/env node
// Export an effect as a native Aseprite file with separate color and additive-light layers.
// Usage: node tools/aseprite.mjs scifi/door <output.aseprite>

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";
import { loadEffect, renderFrames } from "./lib/fxlib.mjs";

const [id, output] = process.argv.slice(2);
if (!id || !output) throw new Error("usage: node tools/aseprite.mjs <effect> <output.aseprite>");

const fx = await loadEffect(id);
const r = renderFrames(fx, { bg: "none" });
const { w, h, fps, frames } = r;

const u8 = (n) => { const b = Buffer.alloc(1); b[0] = n & 255; return b; };
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n & 65535); return b; };
const i16 = (n) => { const b = Buffer.alloc(2); b.writeInt16LE(n); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
const text = (s) => Buffer.from(s, "utf8");

function chunk(type, body) {
  return Buffer.concat([u32(body.length + 6), u16(type), body]);
}

function layerChunk(name, blendMode = 0) {
  return chunk(0x2004, Buffer.concat([
    u16(1), u16(0), u16(0), u16(0), u16(0), u16(blendMode), u8(255), Buffer.alloc(3),
    u16(Buffer.byteLength(name)), text(name),
  ]));
}

function celChunk(layer, pixels) {
  const compressed = deflateSync(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength));
  return chunk(0x2005, Buffer.concat([
    u16(layer), i16(0), i16(0), u8(255), u16(2), i16(0), Buffer.alloc(5),
    u16(w), u16(h), compressed,
  ]));
}

function lightRgba(packed) {
  const out = new Uint8Array(packed.length * 4);
  for (let i = 0; i < packed.length; i++) {
    const c = packed[i], j = i * 4, r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
    out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = Math.max(r, g, b);
  }
  return out;
}

function frameChunk(index, color, light) {
  const chunks = [];
  if (index === 0) chunks.push(layerChunk("Color"), layerChunk("Light", 16));
  chunks.push(celChunk(0, color), celChunk(1, light));
  const duration = Math.max(1, Math.round(1000 / fps));
  const head = Buffer.concat([u16(0xf1fa), u16(chunks.length), u16(duration), u8(0), u8(0), u32(chunks.length)]);
  return Buffer.concat([u32(head.length + Buffer.concat(chunks).length + 4), head, ...chunks]);
}

const header = Buffer.alloc(128);
header.writeUInt16LE(0xa5e0, 4);
header.writeUInt16LE(frames.length, 6);
header.writeUInt16LE(w, 8);
header.writeUInt16LE(h, 10);
header.writeUInt16LE(32, 12);
header.writeUInt16LE(Math.max(1, Math.round(1000 / fps)), 16);
header.writeUInt32LE(0, 28);
header.writeUInt32LE(0, 32);
header[36] = 1;
header[37] = 1;
header.writeUInt16LE(0, 40);
header.writeUInt16LE(0, 42);
header.writeUInt16LE(w, 44);
header.writeUInt16LE(h, 46);

const body = frames.map((f, i) => frameChunk(i, f.raw, lightRgba(f.light)));
const file = Buffer.concat([header, ...body]);
file.writeUInt32LE(file.length, 0);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, file);
console.log(`${id}: ${frames.length} frames, ${w}x${h}, Color + Light layers -> ${output}`);

