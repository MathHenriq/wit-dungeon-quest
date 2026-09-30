# Prompts dos tapetes do duelo (GPT)

O tapete é a mesa do duelo: o aluno compra com moedas e escolhe qual usa
(aba **TAPETES** na tela do deck). Os tapetes feitos em código já estão no
jogo; estes aqui são os de **imagem** (anime, cartas, monstrinhos), que
aparecem como EM BREVE até a arte chegar.

- Salve em `public/Novos assets/tapetes/<id>.png` e rode
  `python3 scripts/arte/importar-tapetes.py` (gera `public/game/tapetes/<id>.webp`).
  Depois é só tirar o `emBreve` do tapete em `src/game/playmats.ts`.
- Formato **paisagem 3:2** (1536 × 1024). O jogo mostra a faixa do meio,
  inclinada, então **o centro precisa ser calmo e mais escuro** (as cartas
  ficam por cima) e os detalhes bonitos vão para as **bordas e cantos**.
- **Tudo original**: estilo anime, mas sem personagem, logo, símbolo ou
  criatura de obra nenhuma (nada de Pokémon, Naruto, One Piece etc.). O GPT
  costuma recusar ou copiar; se aparecer algo reconhecível, refaça.
- Sem texto, sem letras, sem números na imagem.
- Público infantil: nada sensual, sem sangue. Reviso uma por uma antes de subir.

---

**arena-heroi.png** (Anime)
```
A top-down view of a trading card game playmat, anime style illustration, landscape 3:2. Theme: a shonen tournament arena seen from above at dusk — a stone fighting ring in the center with faint glowing lines, the crowd stands and colorful banners only around the outer edges, dramatic orange and purple sky light spilling from the corners. The center area is darker and calm with low detail so cards can be placed on top. Original design, no existing characters, logos or symbols, no text, no letters, no numbers. Rich colors, clean lineart, soft glow.
```

**espiritos.png** (Anime)
```
A top-down view of a trading card game playmat, anime film style illustration, landscape 3:2. Theme: an enchanted spirit forest at night — mossy ground in the center fading into darkness, giant tree roots, glowing mushrooms, fireflies and small cute original forest spirits peeking only from the edges and corners, soft teal and green light. The center is calm, dark and low detail so cards can be placed on top. Original design, no existing characters or symbols, no text, no letters. Painterly, warm and magical.
```

**cidade-neon.png** (Anime)
```
A top-down view of a trading card game playmat, anime cyberpunk style illustration, landscape 3:2. Theme: rooftops of a futuristic city at night seen from above — the center is a dark rooftop floor with subtle hexagon pattern, glowing pink and cyan neon signs without letters, holograms and city lights only along the edges and corners. The center is calm and darker so cards can be placed on top. Original design, no logos, no text, no letters, no numbers. Crisp lineart, vivid neon glow.
```

**cartas-lendarias.png** (Cartas)
```
A top-down view of a trading card game playmat, fantasy anime style, landscape 3:2. Theme: legendary cards — a dark velvet table surface with a large faint golden magic circle in the center, fans of glowing golden card backs (plain ornate backs, no faces, no text) and floating runes around the edges, sparkles and light rays from the corners. The center is calm, dark and low detail so cards can be placed on top. Original design, no existing symbols or logos, no text, no letters. Elegant gold and deep purple palette.
```

**monstrinhos.png** (Monstrinhos)
```
A top-down view of a trading card game playmat, cute anime monster-battle style, landscape 3:2. Theme: an outdoor battle field seen from above — soft grass field with a large faint white battle circle in the center, rocks, flowers and a small pond at the edges, and a few cute ORIGINAL little monsters (invented designs, not from any existing franchise) peeking from the corners. The center is calm, slightly darker and low detail so cards can be placed on top. No Pokémon or any existing creature, no pokéball, no logos, no text, no letters. Bright friendly colors, clean lineart.
```
