// Carrega os sprites de public/game/world no Node (scripts e testes).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ManifestEntry, WorldAssets } from '../../src/game/world/assets';
import { readPng } from './png';

export function loadWorldAssetsNode(dir = join(__dirname, '..', '..', 'public', 'game', 'world')): WorldAssets {
  const manifest: Record<string, ManifestEntry> = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const out: WorldAssets = {};
  for (const [name, m] of Object.entries(manifest)) {
    const night = join(dir, `${name}-noite.png`);
    out[name] = { pix: readPng(join(dir, `${name}.png`)), night: m.noite && existsSync(night) ? readPng(night) : undefined };
  }
  return out;
}
