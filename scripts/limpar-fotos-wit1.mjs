// Limpa o bucket `profile-photos` (fotos e sprites do WIT 1).
//
// Por que existe: o bucket chegou a ~1 GB sozinho, estourou a cota de Storage
// do plano Free da organização e o Supabase passou a responder 402 em todos os
// projetos dela (o Integrador caiu junto). O WIT 2 não lê nem grava nada neste
// bucket: só o portal antigo do WIT 1 usava, e ele manda todo aluno para /wit2
// antes de abrir (StudentPortal.tsx).
//
// O que ele faz, nesta ordem:
//   1. lista todos os arquivos do bucket;
//   2. junta toda URL do bucket que ainda aparece no banco (characters.sprite_*,
//      students/student_profiles.profile_photo_url, enemies.sprite_url,
//      boss_raids.boss_sprite);
//   3. separa: ÓRFÃO = nenhuma linha aponta para ele; WIT 1 = um personagem ou
//      aluno do WIT 1 ainda aponta;
//   4. sem --apagar, só mostra o plano e grava a lista. Não apaga nada;
//   5. com --apagar, baixa cada arquivo para a pasta de backup e só apaga os
//      que baixaram certinho.
//
// Uso (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."   # Project Settings → API → service_role
//   node scripts/limpar-fotos-wit1.mjs                  # só mostra (padrão)
//   node scripts/limpar-fotos-wit1.mjs --apagar         # backup + apaga os ÓRFÃOS
//   node scripts/limpar-fotos-wit1.mjs --apagar --tudo  # backup + apaga órfãos E os do WIT 1
//
// Outras opções: --backup <pasta> (padrão: backup-fotos-wit1), --sem-backup.
//
// Enquanto a organização estiver restrita, o Storage responde 402 e o script
// para logo na listagem, sem apagar nada. Rode depois que a restrição sair.

import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const BUCKET = 'profile-photos';

// A página /battle-demo usa três arquivos desta pasta direto pela URL
// (src/pages/BattleDemo.tsx). Fica fora da limpeza em qualquer modo.
export const PROTEGIDOS = ['sprites/fa180816-50eb-4b31-afa2-147626bbf14e/'];

// Colunas que podem guardar URL do bucket. Se uma delas não existir, o script
// para: melhor não apagar nada do que apagar sem ter olhado tudo.
const COLUNAS = [
  ['characters', ['sprite_normal', 'sprite_pixel_front', 'sprite_pixel_back', 'sprite_pixel_attack']],
  ['students', ['profile_photo_url']],
  ['student_profiles', ['profile_photo_url']],
  ['enemies', ['sprite_url']],
  ['boss_raids', ['boss_sprite']],
];

/** Caminho do arquivo dentro do bucket a partir de uma URL (pública ou assinada), ou null. */
export function caminhoDaUrl(url) {
  if (typeof url !== 'string') return null;
  const marca = `/${BUCKET}/`;
  const i = url.indexOf(marca);
  if (i < 0) return null;
  const resto = url.slice(i + marca.length).split(/[?#]/)[0];
  if (!resto) return null;
  try { return decodeURIComponent(resto); } catch { return resto; }
}

export function protegido(caminho) {
  return PROTEGIDOS.some((p) => caminho.startsWith(p));
}

/** Separa os arquivos em órfãos, do WIT 1 (referenciados) e protegidos. */
export function montarPlano(arquivos, referenciados) {
  const plano = { orfaos: [], wit1: [], protegidos: [] };
  for (const a of arquivos) {
    if (protegido(a.caminho)) plano.protegidos.push(a);
    else if (referenciados.has(a.caminho)) plano.wit1.push(a);
    else plano.orfaos.push(a);
  }
  return plano;
}

export function tamanho(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} kB`;
}

const soma = (lista) => lista.reduce((t, a) => t + a.bytes, 0);

function falhar(etapa, erro) {
  const msg = erro?.message ?? String(erro);
  const status = erro?.status ?? erro?.statusCode;
  if (String(status) === '402' || /402|restrict|payment/i.test(msg)) {
    console.error(`\n✖ ${etapa}: o Supabase respondeu 402 (organização restrita por cota).`);
    console.error('  Nada foi apagado. Rode de novo depois que a restrição sair');
    console.error('  (virada do ciclo de cobrança, ou na hora se passar para o Pro).');
  } else {
    console.error(`\n✖ ${etapa}: ${msg}`);
    console.error('  Nada foi apagado.');
  }
  process.exit(1);
}

async function listarTudo(storage, prefixo = '') {
  const saida = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list(prefixo, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) falhar(`listar "${prefixo || '/'}"`, error);
    for (const item of data) {
      const caminho = prefixo ? `${prefixo}/${item.name}` : item.name;
      if (item.id === null) saida.push(...await listarTudo(storage, caminho)); // pasta
      else saida.push({ caminho, bytes: Number(item.metadata?.size ?? 0) });
    }
    if (data.length < 1000) return saida;
  }
}

async function urlsNoBanco(db) {
  const caminhos = new Set();
  for (const [tabela, colunas] of COLUNAS) {
    for (let de = 0; ; de += 1000) {
      const { data, error } = await db.from(tabela).select(colunas.join(',')).range(de, de + 999);
      if (error) falhar(`ler ${tabela}`, error);
      for (const linha of data) {
        for (const c of colunas) {
          const p = caminhoDaUrl(linha[c]);
          if (p) caminhos.add(p);
        }
      }
      if (data.length < 1000) break;
    }
  }
  return caminhos;
}

async function emParalelo(itens, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < itens.length) { const item = itens[i++]; await fn(item); }
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const apagar = args.includes('--apagar');
  const tudo = args.includes('--tudo');
  const semBackup = args.includes('--sem-backup');
  const iBackup = args.indexOf('--backup');
  const pastaBackup = iBackup >= 0 ? args[iBackup + 1] : 'backup-fotos-wit1';

  const url = process.env.SUPABASE_URL ?? 'https://pvnzfiyxwvfmmhvpvrrk.supabase.co';
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) {
    console.error('Defina SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role).');
    process.exit(1);
  }
  const supabase = createClient(url, chave, { auth: { persistSession: false } });
  const storage = supabase.storage.from(BUCKET);

  console.log(`Listando o bucket ${BUCKET}...`);
  const arquivos = await listarTudo(storage);
  console.log(`Lendo as URLs que o banco ainda guarda...`);
  const refs = await urlsNoBanco(supabase);

  const plano = montarPlano(arquivos, refs);
  const alvo = tudo ? [...plano.orfaos, ...plano.wit1] : plano.orfaos;

  console.log(`\nBucket ${BUCKET}: ${arquivos.length} arquivos, ${tamanho(soma(arquivos))}`);
  console.log(`  órfãos (ninguém aponta):    ${String(plano.orfaos.length).padStart(4)}  ${tamanho(soma(plano.orfaos))}`);
  console.log(`  WIT 1 (personagem aponta):  ${String(plano.wit1.length).padStart(4)}  ${tamanho(soma(plano.wit1))}`);
  console.log(`  protegidos (/battle-demo):  ${String(plano.protegidos.length).padStart(4)}  ${tamanho(soma(plano.protegidos))}`);
  console.log(`\nModo: ${tudo ? 'órfãos + WIT 1' : 'só órfãos'} → ${alvo.length} arquivos, ${tamanho(soma(alvo))}`);

  await mkdir(pastaBackup, { recursive: true });
  const listaPlano = join(pastaBackup, 'plano.json');
  await writeFile(listaPlano, JSON.stringify({ geradoEm: new Date().toISOString(), modo: tudo ? 'tudo' : 'orfaos', ...plano }, null, 2));
  console.log(`Lista completa em ${listaPlano}`);

  if (!apagar) {
    console.log('\nNada foi apagado. Para apagar, rode de novo com --apagar.');
    return;
  }
  if (alvo.length === 0) { console.log('\nNada para apagar.'); return; }

  // Backup primeiro; só entra na lista de remoção o que baixou.
  let prontos = alvo;
  if (!semBackup) {
    console.log(`\nBaixando backup para ${pastaBackup}/ ...`);
    prontos = [];
    const falhas = [];
    let feitos = 0;
    await emParalelo(alvo, 6, async (a) => {
      const { data, error } = await storage.download(a.caminho);
      if (error) { falhas.push({ ...a, erro: error.message }); return; }
      const destino = join(pastaBackup, a.caminho);
      await mkdir(dirname(destino), { recursive: true });
      await writeFile(destino, Buffer.from(await data.arrayBuffer()));
      prontos.push(a);
      if (++feitos % 50 === 0) console.log(`  ${feitos}/${alvo.length}`);
    });
    if (falhas.length) {
      await writeFile(join(pastaBackup, 'falhas-backup.json'), JSON.stringify(falhas, null, 2));
      console.log(`  ${falhas.length} não baixaram (ficam no bucket; ver falhas-backup.json).`);
    }
    console.log(`  backup ok: ${prontos.length} arquivos, ${tamanho(soma(prontos))}`);
  }

  console.log('\nApagando...');
  let apagados = 0;
  for (let i = 0; i < prontos.length; i += 100) {
    const lote = prontos.slice(i, i + 100).map((a) => a.caminho);
    const { data, error } = await storage.remove(lote);
    if (error) {
      console.error(`✖ Parou no lote ${i / 100 + 1}: ${error.message}. ${apagados} já tinham sido apagados.`);
      process.exit(1);
    }
    apagados += data.length;
  }
  console.log(`✔ ${apagados} arquivos apagados (${tamanho(soma(prontos))}).`);
  if (!semBackup) console.log(`  Backup em ${pastaBackup}/ — guarde fora do repositório se quiser manter.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => falhar('erro inesperado', e));
}
