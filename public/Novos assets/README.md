# Novos assets

Imagens geradas no GPT (fundo magenta #FF00FF), antes da conversão para o jogo.
Converter: `python3 scripts/arte/importar-gpt.py --folha saida.png` — gera
`public/game/world/<nome>.png`, `<nome>-noite.png` e `manifest.json`.

Para acrescentar uma imagem: salve aqui com um nome curto (ex.: `casa-padaria.png`)
e registre o nome e o tamanho no jogo em `SINGLE` ou `SHEETS` no topo do script.
Folhas com vários objetos são cortadas na ordem de leitura (linha a linha,
da esquerda para a direita).

Toda imagem é revisada antes de entrar no jogo (público infantil).
