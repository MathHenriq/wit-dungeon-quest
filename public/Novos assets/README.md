# Novos assets

Imagens geradas no GPT (fundo magenta #FF00FF), antes da conversão para o jogo.
Converter: `python3 scripts/arte/importar-gpt.py --folha saida.png` — gera
`public/game/world/<nome>.png`, `<nome>-noite.png` e `manifest.json`
(e a mesma coisa em 2× em `public/game/world/hd/`, que é a que o jogo desenha)
(o script acha a imagem pelo nome em qualquer subpasta).

| Pasta | Conteúdo |
|---|---|
| `predios/` | Torre, Oficina, Arena, Castelo, Loja (palácio de cartas) |
| `casas/cidade/` | As 6 casas do centro da cidade |
| `casas/iniciais/` | Os 3 modelos que o aluno escolhe ao começar |
| `casas/compraveis/` | Os 7 modelos à venda na Loja |
| `casas/moradores/` | As 8 casas dos moradores do Bairro Novo |
| `natureza/` | Folha das árvores (`arvores.png`) e da natureza (`folha-d.png`) |
| `objetos/` | Folhas A, B e C (postes, bancos, fonte, mural, portal...) |
| `chao/` | Tiles de chão (grama, mato, areia, calçada, água, flores, floresta) |
| `personagem/` | Peças e personagens prontos (ver o README de lá) |

Para acrescentar uma imagem: salve na pasta certa com um nome curto e
registre o nome e o tamanho no jogo em `SINGLE` ou `SHEETS` no topo do script.
Toda imagem é revisada antes de entrar no jogo (público infantil).
