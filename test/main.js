import { createFrame, clearFrame, createFx, composite } from "pixelfx";
import * as candle from "pixelfx/fx/fire/candle.js";

const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
// const backgroundColor = 0x10131f;

const frame = createFrame(320, 180);                   // your game's pixel resolution
const img = ctx.createImageData(320, 180);
const fx = createFx(candle, { x: 160, y: 140 });       // also: flip, angle, seed, palette, light...

function tick(dt) {
  fx.update(dt);
  clearFrame(frame);
  fx.draw(frame);
  composite(frame, img.data);         // color, then light added on top
  ctx.putImageData(img, 0, 0);                         // scale up with image-rendering: pixelated
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  tick(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
