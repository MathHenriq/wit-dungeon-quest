// Utilitários dos scripts de revisão: salvar Pixmap em PNG ampliado.
import { writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
import { Pixmap } from '../../src/game/world/pixmap';

export function encodePng(w: number, h: number, rgba: Uint8Array | Uint8ClampedArray): Buffer {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Salva ampliado por número inteiro (pixel perfeito). */
export function savePixmap(pm: Pixmap, file: string, scale = 1): void {
  const W = pm.w * scale, H = pm.h * scale;
  const out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const s = (((y / scale) | 0) * pm.w + ((x / scale) | 0)) * 4, d = (y * W + x) * 4;
    out[d] = pm.data[s]; out[d + 1] = pm.data[s + 1]; out[d + 2] = pm.data[s + 2]; out[d + 3] = pm.data[s + 3];
  }
  writeFileSync(file, encodePng(W, H, out));
}
