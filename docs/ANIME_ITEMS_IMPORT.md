# Anime Items Import

Fluxo para transformar as imagens em itens de loja/inventario.

## Pasta de imagens

Coloque os arquivos em:

```bash
public/images/Itens/
```

## Gerar catalogo

```bash
npm run items:generate
```

Isso cria:

```bash
src/data/anime-items-catalog.json
```

O catalogo inclui nome, anime de origem estimado, raridade, categoria, preco,
imagem, atributos e metadados da habilidade ativa.

## Aplicar banco

Antes de importar, aplique a migration que adiciona raridades novas e metadados
de habilidade:

```bash
npm run db:migrate
```

## Importar para um professor

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
$env:TEACHER_ID = "uuid-do-professor"
npm run items:import
```

O importador atualiza itens existentes pelo par professor + nome e insere os
que ainda nao existem. Assim o comando pode ser rodado de novo depois de
ajustes no catalogo.
