#!/usr/bin/env python3
"""Kit dos bonecos dos professores: o Cowork usa o GPT no Chrome, este script faz o resto.

Pasta de trabalho (a que você escolhe no Cowork, FORA do repositório):

  PASTA/fotos/      você coloca as fotos com o nome do professor no arquivo
                    ("Dante.jpg", "matheus macedo 2.png", "grazy-rosto.jpeg"...)
  PASTA/kit/        este kit (kit.py, professores.json, referencia.png, COWORK.md)
  o resto o kit cria: entrada/ prompts/ gerados/ revisao/ aprovados/ fila.json

Comandos (python3 kit/kit.py <comando> PASTA ...):

  preparar PASTA            acha as fotos, monta entrada/prof-<id>.png (foto + folha de
                            referência numa imagem só: 1 upload por professor) e a fila
  proxima PASTA             a próxima tarefa (JSON: arquivo para anexar, prompt, conversa)
  receber PASTA TAREFA ARQ  guarda a imagem que o GPT fez, confere e monta a revisão
  aprovar PASTA TAREFA      (só depois de VOCÊ ver a revisão) vai para aprovados/
  refazer PASTA TAREFA [motivo]  volta para a fila (nova conversa no GPT)
  pular PASTA TAREFA        tira da fila (ex.: o GPT recusou a foto)
  status PASTA              o quadro da fila
  exportar PASTA            aprovados/ -> para-o-claude.zip (sem foto nenhuma)

As fotos nunca saem desta pasta: o zip leva só os bonecos aprovados.
Precisa de Python 3 com Pillow e numpy (pip install pillow numpy).
"""
import json
import re
import shutil
import sys
import unicodedata
import zipfile
from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

KIT = Path(__file__).resolve().parent
DATA = json.loads((KIT / 'professores.json').read_text(encoding='utf-8'))
PROFS = DATA['professores']
FOTO_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.bmp'}
MAX_TENTATIVAS = 3


def referencia() -> Path:
    for p in (KIT / 'referencia.png', KIT.parents[2] / 'public/Novos assets/personagem/modelos/modelo-01.png'):
        if p.exists():
            return p
    sys.exit('Falta a folha de referência (kit/referencia.png).')


def fonte(tam):
    try:
        return ImageFont.load_default(size=tam)
    except TypeError:  # Pillow antigo
        return ImageFont.load_default()


def norm(s: str) -> str:
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z]+', ' ', s).strip()


# ---------------------------------------------------------------- tarefas e fila

def tarefas():
    """Todas as tarefas, na ordem: primeiro os 12 bonecos, depois ações e motos (que usam o boneco aprovado)."""
    out = [{'tarefa': f"prof-{p['id']}", 'id': p['id'], 'tipo': 'andar', 'linhas': 4} for p in PROFS]
    for p in PROFS:
        for nome, acao in (p.get('acoes') or {}).items():
            out.append({'tarefa': f"prof-{p['id']}-{nome}", 'id': p['id'], 'tipo': 'acao', 'acao': acao, 'linhas': 1})
        if p.get('moto'):
            out.append({'tarefa': f"prof-{p['id']}-moto", 'id': p['id'], 'tipo': 'moto', 'linhas': 4})
    return out


def prof(pid):
    return next(p for p in PROFS if p['id'] == pid)


def prompt_de(t):
    p = prof(t['id'])
    if t['tipo'] == 'andar':
        return DATA['prompts']['andar'].replace('{detalhe}', p['detalhe'])
    if t['tipo'] == 'acao':
        return DATA['prompts']['acao'].replace('{acao}', t['acao'])
    return DATA['prompts']['moto']


def ler_fila(pasta: Path):
    f = pasta / 'fila.json'
    return json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}


def salvar_fila(pasta: Path, fila):
    (pasta / 'fila.json').write_text(json.dumps(fila, indent=1, ensure_ascii=False), encoding='utf-8')


def estado(pasta, fila, t):
    """pendente | esperando (falta o boneco ou a foto) | conferir | aprovado | pulado."""
    e = fila.get(t['tarefa'], {})
    if e.get('status') in ('aprovado', 'pulado', 'conferir'):
        return e['status']
    if t['tipo'] == 'andar':
        return 'pendente' if (pasta / 'entrada' / f"{t['tarefa']}.png").exists() else 'esperando'
    return 'pendente' if (pasta / 'aprovados' / f"prof-{t['id']}.png").exists() else 'esperando'


# ---------------------------------------------------------------- preparar

def achar_fotos(pasta: Path):
    fotos = [f for f in sorted((pasta / 'fotos').rglob('*')) if f.suffix.lower() in FOTO_EXT]
    achadas, sobras = {p['id']: [] for p in PROFS}, []
    for f in fotos:
        txt = ' ' + norm(f.stem if f.parent == pasta / 'fotos' else f'{f.parent.name} {f.stem}') + ' '
        quem = [p['id'] for p in PROFS if any(f' {n} ' in txt for n in p['nomes'])]
        # "matheus" sozinho é ambíguo; "matheus macedo" acha os dois nomes mas só um é completo
        if len(quem) > 1:
            longos = [q for q in quem if any(' ' in n and f' {n} ' in txt for n in prof(q)['nomes'])]
            quem = longos if len(longos) == 1 else quem
        if len(quem) == 1:
            achadas[quem[0]].append(f)
        else:
            sobras.append((f, quem))
    return achadas, sobras


def abrir_foto(f: Path) -> Image.Image:
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    im.thumbnail((1024, 1024))
    return im


def montar_entrada(fotos, saida: Path):
    """Foto(s) à esquerda, folha de referência à direita, com etiqueta: uma imagem só para anexar."""
    ref = Image.open(referencia()).convert('RGB')
    H = 1024
    ref = ref.resize((round(ref.width * H / ref.height), H), Image.NEAREST)
    fotos = [abrir_foto(f) for f in fotos[:3]]
    h_cada = H // len(fotos)
    fotos = [f.resize((round(f.width * h_cada / f.height), h_cada)) for f in fotos]
    wf = max(f.width for f in fotos)
    top, gap = 70, 40
    img = Image.new('RGB', (wf + gap + ref.width, H + top), 'white')
    y = top
    for f in fotos:
        img.paste(f, ((wf - f.width) // 2, y))
        y += f.height
    img.paste(ref, (wf + gap, top))
    d = ImageDraw.Draw(img)
    d.rectangle([wf + 8, 0, wf + gap - 8, H + top], fill=(40, 40, 40))
    for x, w, txt in ((0, wf, 'PHOTO (look only)'), (wf + gap, ref.width, 'SPRITE SHEET (grid and poses only)')):
        d.text((x + w // 2, top // 2), txt, fill='black', font=fonte(40), anchor='mm')
    saida.parent.mkdir(parents=True, exist_ok=True)
    img.save(saida)


def cmd_preparar(pasta: Path):
    if not (pasta / 'fotos').is_dir():
        (pasta / 'fotos').mkdir(parents=True)
        sys.exit(f'Criei {pasta / "fotos"}: coloque as fotos lá (nome do professor no arquivo) e rode de novo.')
    achadas, sobras = achar_fotos(pasta)
    (pasta / 'prompts').mkdir(exist_ok=True)
    print('Fotos:')
    for p in PROFS:
        fs = achadas[p['id']]
        if fs:
            montar_entrada(fs, pasta / 'entrada' / f"prof-{p['id']}.png")
        print(f"  {p['nome']:28} {', '.join(f.name for f in fs) or 'SEM FOTO'}")
    for f, quem in sobras:
        dica = 'de quem? ' + '/'.join(quem) if quem else 'qual Matheus? ponha "macedo" ou "servilha" no nome' if 'matheus' in norm(f.stem) else 'não achei o nome do professor no arquivo'
        print(f"  ? {f.name}: {dica}")
    for t in tarefas():
        (pasta / 'prompts' / f"{t['tarefa']}.txt").write_text(prompt_de(t), encoding='utf-8')
    fila = ler_fila(pasta)
    salvar_fila(pasta, fila)
    print()
    cmd_status(pasta)


# ---------------------------------------------------------------- conferir

def mascara(a):
    r, g, b = (a[..., i].astype(int) for i in range(3))
    mag = (r > 150) & (b > 150) & (g < 120) & (np.abs(r - b) < 90)
    m = ~mag
    p = np.pad(m, 1)
    viz = sum(p[1 + dy:p.shape[0] - 1 + dy, 1 + dx:p.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
    return m & (viz >= 5), mag


def faixas(v, thr, gap, minimo):
    on = v >= thr
    out, i, n = [], 0, len(v)
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]:
                j += 1
            if out and i - out[-1][1] < gap:
                out[-1][1] = j
            else:
                out.append([i, j])
            i = j
        else:
            i += 1
    return [x for x in out if x[1] - x[0] >= minimo]


def figuras(m, linhas):
    H, W = m.shape
    bands = faixas(m.sum(1), 2, H * 0.012, H * 0.05)
    # duas linhas grudadas (pé de cima encostando na cabeça de baixo): corta no vale
    while len(bands) < linhas and bands:
        k = max(range(len(bands)), key=lambda i: bands[i][1] - bands[i][0])
        y0, y1 = bands[k]
        if y1 - y0 < 1.6 * np.median([b[1] - b[0] for b in bands]) and len(bands) > 1:
            break
        prof_ = m[y0:y1].sum(1)
        a, b = y0 + int((y1 - y0) * .3), y0 + int((y1 - y0) * .7)
        cut = a + int(np.argmin(prof_[a - y0:b - y0]))
        bands[k:k + 1] = [[y0, cut], [cut, y1]]
    res = []
    for y0, y1 in bands:
        row = []
        for x0, x1 in faixas(m[y0:y1].sum(0), 1, W * 0.008, W * 0.02):
            ys = np.where(m[y0:y1, x0:x1].any(1))[0]
            row.append((x0, y0 + ys[0], x1, y0 + ys[-1] + 1))
        res.append(row)
    return res


def iou(a, b):
    h, w = max(a.shape[0], b.shape[0]), max(a.shape[1], b.shape[1])
    A, B = np.zeros((h, w), bool), np.zeros((h, w), bool)
    A[h - a.shape[0]:, (w - a.shape[1]) // 2:(w - a.shape[1]) // 2 + a.shape[1]] = a
    B[h - b.shape[0]:, (w - b.shape[1]) // 2:(w - b.shape[1]) // 2 + b.shape[1]] = b
    return (A & B).sum() / max(1, (A | B).sum())


def conferir(arq: Path, linhas: int):
    """Confere o que dá para medir: fundo, grade, tamanho e se as linhas 2 e 3 são espelho.
    Para onde cada linha olha e se parece com a pessoa: quem confere é o olho (revisão)."""
    a = np.array(Image.open(arq).convert('RGB'))
    m, mag = mascara(a)
    erros, avisos = [], []
    borda = np.concatenate([mag[:6].ravel(), mag[-6:].ravel(), mag[:, :6].ravel(), mag[:, -6:].ravel()])
    if mag.mean() < 0.35 or borda.mean() < 0.9:
        erros.append('fundo')
    figs = figuras(m, linhas) if 'fundo' not in erros else []
    if 'fundo' in erros:
        pass
    elif len(figs) != linhas or any(len(r) != 4 for r in figs):
        erros.append('grade')
    elif linhas == 4:
        hs = np.array([[f[3] - f[1] for f in r] for r in figs], float)
        if (hs.max(1) / hs.min(1)).max() > 1.15:
            erros.append('tamanho')
        elif hs.max() / hs.min() > 1.15:
            avisos.append('uma linha saiu maior que as outras (o importador iguala a altura das linhas)')
        r2 = [m[f[1]:f[3], f[0]:f[2]] for f in figs[1]]
        r3 = [m[f[1]:f[3], f[0]:f[2]] for f in figs[2]]
        direto = np.mean([iou(x, y) for x, y in zip(r2, r3)])
        espelho = np.mean([iou(x[:, ::-1], y) for x, y in zip(r2, r3)])
        if direto > espelho + 0.03:
            erros.append('espelho')
        r1 = [m[f[1]:f[3], f[0]:f[2]] for f in figs[0]]
        r4 = [m[f[1]:f[3], f[0]:f[2]] for f in figs[3]]
        if np.mean([iou(x, y) for x, y in zip(r1, r2)]) > 0.9:
            avisos.append('a linha 1 parece igual à linha 2 (de lado?)')
        if np.mean([iou(x, y) for x, y in zip(r4, r3)]) > 0.9:
            avisos.append('a linha 4 parece igual à linha 3 (de lado?)')
    return {'ok': not erros, 'erros': erros, 'avisos': avisos, 'figuras': figs, 'tamanho': [a.shape[1], a.shape[0]]}


def revisao(arq: Path, res, saida: Path, fotos):
    """Folha para olhar: os quadros no tamanho do jogo (×3) num chão verde, com a direção que cada
    linha DEVE ter, a foto ao lado; e um GIF andando."""
    a = np.array(Image.open(arq).convert('RGB'))
    m, _ = mascara(a)
    figs = res['figuras']
    hmax = max(f[3] - f[1] for r in figs for f in r)
    alvo = 64  # altura do professor no jogo (hd)
    k = alvo / hmax
    Z, CW, CH = 3, 64, 80
    nomes = ['FRENTE (anda para baixo)', 'OLHA PARA A ESQUERDA  <-', 'OLHA PARA A DIREITA  ->', 'COSTAS (anda para cima)'] if len(figs) == 4 else ['ACAO']
    lab = 300
    foto_w = 300
    W = lab + 4 * CW * Z + 20 + foto_w
    H = max(len(figs) * CH * Z, 400) + 50
    img = Image.new('RGB', (W, H), (150, 200, 130))
    d = ImageDraw.Draw(img)
    d.text((10, 10), arq.name, fill='black', font=fonte(24))
    quadros = []
    for ri, r in enumerate(figs):
        linha = []
        for ci, (x0, y0, x1, y1) in enumerate(r):
            cut = np.dstack([a[y0:y1, x0:x1], m[y0:y1, x0:x1] * 255]).astype(np.uint8)
            fig = Image.fromarray(cut, 'RGBA')
            fig = fig.resize((max(1, round(fig.width * k)), max(1, round(fig.height * k))), Image.BOX)
            cell = Image.new('RGBA', (CW, CH))
            cell.alpha_composite(fig, ((CW - fig.width) // 2, max(0, 76 - fig.height)))
            linha.append(cell)
            big = cell.resize((CW * Z, CH * Z), Image.NEAREST)
            img.paste(big, (lab + ci * CW * Z, 50 + ri * CH * Z), big)
        quadros.append(linha)
        d.text((10, 50 + ri * CH * Z + CH * Z // 2), nomes[ri] if ri < len(nomes) else '', fill='black', font=fonte(22), anchor='lm')
    if fotos:
        f = abrir_foto(fotos[0])
        f.thumbnail((foto_w, H - 60))
        img.paste(f, (W - foto_w, 50))
    saida.parent.mkdir(parents=True, exist_ok=True)
    img.save(saida)
    # GIF: cada linha andando, lado a lado, no tamanho do jogo ×3
    frames = []
    for c in range(4):
        fr = Image.new('RGB', (len(quadros) * CW * Z, CH * Z), (150, 200, 130))
        for ri, linha in enumerate(quadros):
            if c < len(linha):
                big = linha[c].resize((CW * Z, CH * Z), Image.NEAREST)
                fr.paste(big, (ri * CW * Z, 0), big)
        frames.append(fr)
    frames[0].save(saida.with_suffix('.gif'), save_all=True, append_images=frames[1:], duration=180, loop=0)


# ---------------------------------------------------------------- comandos

def achar_tarefa(nome):
    nome = Path(nome).stem
    t = next((t for t in tarefas() if t['tarefa'] == nome), None)
    if not t:
        sys.exit(f'Tarefa desconhecida: {nome}. Veja "status".')
    return t


def cmd_proxima(pasta: Path):
    fila = ler_fila(pasta)
    for t in tarefas():
        if estado(pasta, fila, t) != 'pendente':
            continue
        e = fila.get(t['tarefa'], {})
        anexo = pasta / 'entrada' / f"{t['tarefa']}.png" if t['tipo'] == 'andar' else pasta / 'aprovados' / f"prof-{t['id']}.png"
        print(json.dumps({
            'tarefa': t['tarefa'], 'professor': prof(t['id'])['nome'], 'tipo': t['tipo'],
            'anexar': str(anexo), 'prompt': prompt_de(t),
            'tentativas': e.get('tentativas', 0), 'max_tentativas': MAX_TENTATIVAS,
            'baixar_como': f"{t['tarefa']}-t{e.get('tentativas', 0) + 1}.png",
            'pedido_do_matheus': e.get('motivo_refazer') or None,
        }, indent=1, ensure_ascii=False))
        return
    print(json.dumps({'tarefa': None, 'aviso': 'Nada pendente. Veja "status" (pode faltar foto ou aprovação).'}, ensure_ascii=False))


def cmd_receber(pasta: Path, nome, arq):
    t = achar_tarefa(nome)
    arq = Path(arq)
    if not arq.exists():
        sys.exit(f'Não achei {arq}')
    fila = ler_fila(pasta)
    e = fila.setdefault(t['tarefa'], {'tentativas': 0})
    e['tentativas'] = e.get('tentativas', 0) + 1
    dest = pasta / 'gerados' / f"{t['tarefa']}-t{e['tentativas']}{arq.suffix.lower()}"
    dest.parent.mkdir(exist_ok=True)
    shutil.copy2(arq, dest)
    res = conferir(dest, t['linhas'])
    fotos = achar_fotos(pasta)[0].get(t['id']) if t['tipo'] == 'andar' else None
    rev = pasta / 'revisao' / f"{t['tarefa']}-t{e['tentativas']}.png"
    if 'grade' not in res['erros'] and 'fundo' not in res['erros']:
        revisao(dest, res, rev, fotos)
    else:
        rev = None
    e.update({'status': 'conferir', 'arquivo': str(dest), 'revisao': str(rev) if rev else None,
              'erros': res['erros'], 'avisos': res['avisos'], 'quando': datetime.now().isoformat(timespec='minutes')})
    salvar_fila(pasta, fila)
    corr = [DATA['correcoes'][x].replace('{linhas}', str(t['linhas'])).replace('{total}', str(4 * t['linhas'])) for x in res['erros']]
    print(json.dumps({
        'tarefa': t['tarefa'], 'ok_automatico': res['ok'], 'erros': res['erros'], 'avisos': res['avisos'],
        'revisao': str(rev) if rev else None, 'gif': str(rev.with_suffix('.gif')) if rev else None,
        'mensagem_de_correcao': ' '.join(corr) or None,
        'pode_tentar_de_novo': e['tentativas'] < MAX_TENTATIVAS,
        'proximo_passo': ('Mostre a revisão e o GIF ao Matheus e pergunte se aprova.' if res['ok'] else
                          'Mande a mensagem_de_correcao na MESMA conversa do GPT e receba de novo.' if e['tentativas'] < MAX_TENTATIVAS else
                          'Chegou no limite: mostre ao Matheus e pergunte se aprova assim, refaz do zero ou pula.'),
    }, indent=1, ensure_ascii=False))


def cmd_aprovar(pasta: Path, nome):
    t = achar_tarefa(nome)
    fila = ler_fila(pasta)
    e = fila.get(t['tarefa'])
    if not e or not e.get('arquivo'):
        sys.exit('Nada recebido para essa tarefa ainda.')
    (pasta / 'aprovados').mkdir(exist_ok=True)
    shutil.copy2(e['arquivo'], pasta / 'aprovados' / f"{t['tarefa']}.png")
    e['status'] = 'aprovado'
    salvar_fila(pasta, fila)
    print(f"Aprovado: aprovados/{t['tarefa']}.png")


def cmd_refazer(pasta: Path, nome, motivo=''):
    t = achar_tarefa(nome)
    fila = ler_fila(pasta)
    fila[t['tarefa']] = {'tentativas': 0, 'motivo_refazer': motivo}
    (pasta / 'aprovados' / f"{t['tarefa']}.png").unlink(missing_ok=True)
    salvar_fila(pasta, fila)
    print(f"{t['tarefa']} voltou para a fila (abrir conversa nova no GPT).")


def cmd_pular(pasta: Path, nome):
    t = achar_tarefa(nome)
    fila = ler_fila(pasta)
    fila.setdefault(t['tarefa'], {})['status'] = 'pulado'
    salvar_fila(pasta, fila)
    print(f"{t['tarefa']} pulado.")


def cmd_status(pasta: Path):
    fila = ler_fila(pasta)
    cont = {}
    for t in tarefas():
        s = estado(pasta, fila, t)
        cont[s] = cont.get(s, 0) + 1
        e = fila.get(t['tarefa'], {})
        extra = f" (tentativa {e['tentativas']}{', erros: ' + ','.join(e['erros']) if e.get('erros') else ''})" if e.get('tentativas') else ''
        print(f"  {s:10} {t['tarefa']}{extra}")
    print('  ' + ' · '.join(f'{k}: {v}' for k, v in sorted(cont.items())))


def cmd_exportar(pasta: Path):
    ap = sorted((pasta / 'aprovados').glob('prof-*.png'))
    if not ap:
        sys.exit('Nada aprovado ainda.')
    z = pasta / 'para-o-claude.zip'
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        for f in ap:
            zf.write(f, f.name)
    print(f'{z} ({len(ap)} imagens, nenhuma foto). Mande para o Claude do repositório.')


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    cmd, pasta, rest = sys.argv[1], Path(sys.argv[2]).expanduser().resolve(), sys.argv[3:]
    # as fotos nunca podem ir parar no repositório do jogo
    if any((q / '.git').exists() for q in (pasta, *pasta.parents)):
        sys.exit(f'{pasta} está dentro de um repositório git: use uma pasta FORA do projeto (as fotos não podem entrar no git).')
    fn = {'preparar': cmd_preparar, 'proxima': cmd_proxima, 'receber': cmd_receber, 'aprovar': cmd_aprovar,
          'refazer': cmd_refazer, 'pular': cmd_pular, 'status': cmd_status, 'exportar': cmd_exportar}.get(cmd)
    if not fn:
        sys.exit(__doc__)
    fn(pasta, *rest)


if __name__ == '__main__':
    main()
