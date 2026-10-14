# Bonecos dos professores: roteiro para o Claude no Cowork

> Para o Claude: este arquivo é o seu roteiro. Leia tudo antes de começar e siga na ordem.
> Você trabalha na pasta que o Matheus liberou (`WIT-professores/`) e usa o ChatGPT pelo
> Chrome (extensão Claude in Chrome). O `kit/kit.py` faz a parte de arquivo: preparar,
> conferir, aprovar e exportar. Você faz a ponte com o ChatGPT e olha cada imagem.

## Regras (não pule nenhuma)

1. **As fotos só vão para o ChatGPT.** Não mande para outro site e não copie para fora
   desta pasta. O `exportar` gera um zip só com os bonecos, sem nenhuma foto.
2. **O público é infantil.** Toda imagem passa pelo seu olho e pela aprovação do Matheus.
   Recuse e refaça qualquer coisa sensual, roupa curta, arma, sangue ou caricatura que
   ridicularize. Roupa modesta, do dia a dia.
3. **Use uma conversa nova do ChatGPT por tarefa.** As correções de uma tarefa vão na mesma
   conversa. Nunca mexa nas conversas antigas do Matheus.
4. **Nada é aprovado sem o Matheus dizer "aprovo"** (ou "sim") para aquela imagem.
5. O estado fica em `fila.json`. Se o ChatGPT bater no limite de imagens, a conexão cair ou
   a conversa acabar, pare e diga onde parou. O `status` retoma de onde estava.

## 0. Preparar (uma vez)

```
pip install pillow numpy        # se faltar
python3 kit/kit.py preparar .
```
Mostre ao Matheus a lista de fotos.
- **SEM FOTO:** o professor ainda não tem foto. Siga com os outros.
- **"?":** o arquivo não diz de quem é a foto. Pergunte ao Matheus e peça para ele
  renomear (ex.: `Matheus.jpg` → `Matheus Macedo.jpg`). Depois rode `preparar` de novo.

Confirme também:
- Você enxerga a pasta **Downloads** do Chrome. Se não enxergar, peça ao Matheus para
  liberar essa pasta no Cowork.
- O Matheus está logado no chatgpt.com no Chrome.

## 1. Gerar os 12 bonecos andando (sem parar para perguntar)

Repita até `proxima` devolver `"tarefa": null` ou só sobrarem tarefas de ação e moto:

1. Rode `python3 kit/kit.py proxima .`. A resposta é um JSON com `tarefa`, `anexar`,
   `prompt` e `baixar_como`.
2. No Chrome, abra uma aba nova em `https://chatgpt.com/` (conversa nova).
3. **Anexe o arquivo `anexar`** com a ferramenta de upload de arquivo do Claude in Chrome,
   no campo de anexo do ChatGPT (`input[type=file]`).
   - Se o upload falhar, não insista mais de 2 vezes. Peça ao Matheus: *"Arraste o arquivo
     `entrada/<tarefa>.png` para a conversa do ChatGPT que está aberta e me avise"*.
     Espere ele avisar.
4. Cole o `prompt` inteiro na caixa de mensagem e envie.
5. Espere a imagem ficar pronta. Olhe a página a cada ~20 s, por até 6 min. Se o ChatGPT
   **recusar** (política, rosto real...), rode `python3 kit/kit.py pular . <tarefa>`, anote
   a mensagem dele e passe para a próxima.
6. **Baixe a imagem** com o nome `baixar_como`. Rode este JavaScript na aba do ChatGPT,
   trocando `NOME`:
   ```js
   (async () => {
     const imgs = [...document.querySelectorAll('main img')].filter(i => i.naturalWidth >= 512);
     const img = imgs[imgs.length - 1];
     if (!img) return 'sem imagem';
     const blob = await (await fetch(img.src)).blob();
     const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'NOME' });
     document.body.appendChild(a); a.click(); a.remove();
     return `ok ${img.naturalWidth}x${img.naturalHeight}`;
   })()
   ```
   Se der erro, clique no botão de baixar da própria imagem no ChatGPT.
7. Rode `python3 kit/kit.py receber . <tarefa> "<pasta Downloads>/<baixar_como>"`. Se o
   Chrome salvou com outro nome (ex.: `(1)` no fim), use o arquivo mais novo.
8. Leia o JSON que voltou:
   - `ok_automatico: false` e `pode_tentar_de_novo: true`: mande a `mensagem_de_correcao`
     **na mesma conversa** e volte ao passo 5. O próximo arquivo é `<tarefa>-t2.png`,
     `-t3`...
   - `ok_automatico: true`: abra a imagem `revisao` e olhe você mesmo:
     - a linha 1 está de frente;
     - a linha 2 olha e anda para a **esquerda** (o nariz aponta para a esquerda da tela);
     - a linha 3 olha e anda para a **direita**;
     - a linha 4 está de costas;
     - parece com a pessoa da foto (cabelo, pele, barba, óculos);
     - a roupa é modesta.

     Se a direção estiver errada, mande o texto `correcoes.espelho` (ou `frente-costas`)
     do `kit/professores.json` na mesma conversa e receba de novo. Se estiver tudo certo,
     anote para o passo 2 e siga para a próxima tarefa.
   - Chegou a 3 tentativas: deixe para o Matheus decidir no passo 2.

## 2. Aprovação (com o Matheus)

Mostre cada `revisao/<tarefa>-tN.png` (e o `.gif` andando), uma por vez ou em grupo. Diga
o que você achou e pergunte se ele aprova. Para cada resposta:
- **aprovo:** `python3 kit/kit.py aprovar . <tarefa>`
- **refaz:** `python3 kit/kit.py refazer . <tarefa> "<o que ele pediu>"`. Na próxima
  geração, acrescente ao fim do prompt o pedido dele, em inglês.
- **pula:** `python3 kit/kit.py pular . <tarefa>`

## 3. Ações e motos (depois que o boneco do professor foi aprovado)

Essas tarefas aparecem sozinhas no `proxima`: `prof-<id>-acao`, `prof-macedo-churrasco`,
`prof-dante-moto` e `prof-wellington-moto`. O fluxo é o mesmo do passo 1, mas o arquivo
anexado já é o boneco aprovado (sem foto). As ações têm 1 linha de 4 quadros. Confira se é
o mesmo personagem e se a ação está clara. Depois, aprovação como no passo 2.

## 4. Entregar

```
python3 kit/kit.py status .
python3 kit/kit.py exportar .
```
Diga ao Matheus: *"Pronto: `para-o-claude.zip` tem N bonecos aprovados (nenhuma foto).
Mande esse zip para o Claude do repositório do jogo."* O Claude de lá coloca os arquivos em
`public/Novos assets/personagem/professores/` e roda `python3 scripts/arte/importar-sprites.py`.
O professor passa a aparecer com o boneco novo na hora.
