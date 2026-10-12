// Gera uma folha de revisão do boneco em PNG (ampliada, sem borrar).
//   npx vite-node scripts/avatar/folha.ts -- <saida.png> [escala]
import { writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { composeFrame, FRAME, type AvatarLook, type Facing, type Pose } from '../../src/game/avatar/compose';

const args = process.argv.slice(2).filter(a => a !== '--');
const out = args[0] ?? 'folha.png';
const SCALE = Number(args[1] ?? 5);

const LOOKS: AvatarLook[] = [
  { skin: 'clara', hair: 'curto', hairColor: 'castanho', eyes: 'escuro', top: 'vermelho', sleeves: 'curta', bottom: 'jeans', legs: 'comprida', shoes: 'preto' },
  { skin: 'morena', hair: 'coques', hairColor: 'preto', eyes: 'castanho', top: 'lilas', sleeves: 'longa', bottom: 'branco', legs: 'curta', shoes: 'rosa' },
  { skin: 'escura', hair: 'espetado', hairColor: 'preto', eyes: 'escuro', top: 'amarelo', sleeves: 'curta', bottom: 'verde', legs: 'curta', shoes: 'branco' },
  { skin: 'porcelana', hair: 'longo', hairColor: 'rosa', eyes: 'azul', top: 'branco', sleeves: 'longa', bottom: 'rosa', legs: 'comprida', shoes: 'vermelho' },
  { skin: 'canela', hair: 'longo', hairColor: 'loiro', eyes: 'verde', top: 'azul', sleeves: 'curta', bottom: 'caqui', legs: 'comprida', shoes: 'caqui' },
  { skin: 'pessego', hair: 'espetado', hairColor: 'verde', eyes: 'azul', top: 'preto', sleeves: 'longa', bottom: 'preto', legs: 'comprida', shoes: 'branco' },
];

const FRAMES: [Facing, Pose][] = [
  ['down', 0], ['down', 1], ['down', 2],
  ['up', 0], ['up', 1], ['up', 2],
  ['left', 0], ['left', 1], ['left', 2],
  ['right', 0], ['right', 1], ['right', 2],
];

const PAD = 2;
const cell = (FRAME + PAD) * SCALE;
const W = cell * FRAMES.length;
const H = cell * LOOKS.length;
const img = new Uint8Array(W * H * 4);

// Fundo: grama clara em xadrez suave, para ver o contorno.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4;
  const alt = ((Math.floor(x / cell) + Math.floor(y / cell)) & 1) === 0;
  img[i] = alt ? 0xa8 : 0xa0; img[i + 1] = alt ? 0xd8 : 0xd0; img[i + 2] = alt ? 0x90 : 0x88; img[i + 3] = 255;
}

LOOKS.forEach((look, row) => {
  FRAMES.forEach(([facing, pose], col) => {
    const px = composeFrame(look, facing, pose);
    const ox = col * cell + (PAD * SCALE) / 2;
    const oy = row * cell + (PAD * SCALE) / 2;
    for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) {
      const s = (y * FRAME + x) * 4;
      if (px[s + 3] === 0) continue;
      for (let dy = 0; dy < SCALE; dy++) for (let dx = 0; dx < SCALE; dx++) {
        const d = ((oy + y * SCALE + dy) * W + ox + x * SCALE + dx) * 4;
        img[d] = px[s]; img[d + 1] = px[s + 1]; img[d + 2] = px[s + 2]; img[d + 3] = 255;
      }
    }
  });
});

writeFileSync(out, encodePng(W, H, img));
console.log(`${out} (${W}×${H})`);

function encodePng(w: number, h: number, rgba: Uint8Array): Buffer {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
