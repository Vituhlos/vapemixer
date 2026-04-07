#!/usr/bin/env node
// Generates icon-192.png and icon-512.png without external dependencies
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public');
mkdirSync(outDir, { recursive: true });

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type);
  const lenBuf = Buffer.allocUnsafe(4); lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([lenBuf, t, data, crcBuf]);
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size, 0);

  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const R = size / 2;

  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const pi = y * stride + 1 + x * 3;
      const nx = (x - cx) / R;  // normalized -1..1
      const ny = (y - cy) / R;

      // Background gradient: deep navy with ambient blobs
      let r = 10, g = 10, b = 26;

      // Purple blob top-left
      const pd = Math.sqrt((nx + 0.4) ** 2 + (ny + 0.3) ** 2);
      const pa = Math.max(0, 1 - pd * 1.3) ** 1.5 * 0.55;
      r += pa * 78; g += pa * 18; b += pa * 200;

      // Teal blob bottom-right
      const td = Math.sqrt((nx - 0.3) ** 2 + (ny - 0.4) ** 2);
      const ta = Math.max(0, 1 - td * 1.4) ** 1.5 * 0.4;
      r += ta * 0; g += ta * 170; b += ta * 155;

      // Rounded rect mask for icon shape (iOS-style squircle approximation)
      const sq = Math.abs(nx) ** 4 + Math.abs(ny) ** 4;
      if (sq > 0.72) { // outside icon shape
        raw[pi] = raw[pi+1] = raw[pi+2] = 0;
        continue;
      }

      // Draw flask/vial shape
      // Neck: vertical bar from top ~20% to 45% height, width ~12%
      const neckHalf = 0.12;
      const inNeck = Math.abs(nx) < neckHalf && ny > -0.75 && ny < -0.08;

      // Body: circle centered at ~20% below center, radius ~42%
      const bcy = 0.22;
      const bodyDist = Math.sqrt(nx ** 2 + (ny - bcy) ** 2);
      const inBody = bodyDist < 0.44;

      // Cap: small rectangle at very top of neck
      const inCap = Math.abs(nx) < 0.18 && ny > -0.82 && ny < -0.72;

      // Liquid fill inside body (bottom 60% of body)
      const liquidLevel = bcy + 0.44 * 0.35; // fill line
      const inLiquid = inBody && ny > liquidLevel - 0.02;

      // Bubbles inside liquid
      const b1 = Math.sqrt((nx + 0.12) ** 2 + (ny - 0.52) ** 2) < 0.055;
      const b2 = Math.sqrt((nx - 0.06) ** 2 + (ny - 0.62) ** 2) < 0.038;

      if (inCap || inNeck || inBody) {
        if (inLiquid && !b1 && !b2) {
          // Teal liquid
          r = clamp(r + 0); g = clamp(g + 195); b = clamp(b + 175);
          // Slight highlight on left
          const hlAmt = Math.max(0, -nx * 0.6) * 0.3;
          r = clamp(r + hlAmt * 255); g = clamp(g + hlAmt * 255); b = clamp(b + hlAmt * 255);
        } else if (b1 || b2) {
          // Bubble: lighter
          r = clamp(r + 180); g = clamp(g + 230); b = clamp(b + 225);
        } else {
          // Glass: white with blue tint, semi-transparent look
          const glassBase = 215;
          r = clamp(r * 0.2 + glassBase * 0.85);
          g = clamp(g * 0.2 + glassBase * 0.9);
          b = clamp(b * 0.2 + glassBase * 1.0);
          // Highlight: left edge of body
          if (inBody) {
            const edgeDist = Math.abs(bodyDist - 0.44);
            const highlight = Math.max(0, 1 - edgeDist * 40) * Math.max(0, -nx + 0.1) * 0.5;
            r = clamp(r + highlight * 255); g = clamp(g + highlight * 255); b = clamp(b + highlight * 255);
          }
        }
      }

      raw[pi] = clamp(r); raw[pi+1] = clamp(g); raw[pi+2] = clamp(b);
    }
  }

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

writeFileSync(join(outDir, 'icon-192.png'), makePNG(192));
writeFileSync(join(outDir, 'icon-512.png'), makePNG(512));
console.log('Icons generated: icon-192.png, icon-512.png');
