# Base de design das cartas da loja

## Objetivo

Transformar as cartas em um segundo eixo real de progressao. Cada carta deve:

1. ter identidade mecanica propria;
2. mudar decisoes do jogador, e nao apenas somar dano;
3. escalar em fantasia e quebra de regra conforme a raridade sobe;
4. conversar com o novo sistema elemental;
5. fazer cartas raras parecerem raras de verdade.

## Leitura do sistema atual

O motor atual ja suporta:

- dano fisico e magico;
- efetividade elemental;
- critico, evasao e status;
- buffs temporarios simples;
- revive;
- esquiva automatica;
- apagar habilidades inimigas;
- copiar a ultima habilidade inimiga;
- pular turnos do inimigo;
- counters, shields, lifesteal, invencibilidade e dano ao longo do tempo.

Isso e uma boa base, mas ainda e insuficiente para cartas com identidade realmente forte. Hoje faltam primitivas para:

- campos de batalha persistentes (sol, nevoa, dominio, chuva, ruinas, arena);
- afinidades elementais extras do jogador;
- alterar ou inverter a tabela de vantagem elemental;
- transformar o usuario por varios turnos;
- execucoes condicionais;
- multiplos golpes e follow-ups automaticos;
- marcas, juramentos, lacres e contadores;
- copiar, roubar, silenciar ou bloquear classes de acao;
- efeitos de fase, ultimo suspiro e retorno temporal;
- cartas passivas que mudam a luta desde o inicio.

## Filosofia por raridade

### Comum

Cartas pequenas, mas nunca genericas. Devem alterar um turno, uma escolha ou uma pequena regra.

Exemplos:
- garantir prioridade no proximo ataque;
- ignorar evasao uma vez;
- transformar o proximo golpe em corte perfurante;
- ganhar resistencia contra um elemento;
- aplicar uma marca simples que outra carta possa consumir.

### Incomum

Cartas de combo ou setup. Comecam a criar planos de 2 turnos.

Exemplos:
- puxar o inimigo para uma condicao;
- converter o proximo ataque em outro elemento;
- preparar contra-ataque;
- revelar a proxima acao inimiga;
- repetir parte do ultimo golpe.

### Rara

Cartas que alteram uma regra local da luta.

Exemplos:
- apagar uma skill inimiga;
- equipar temporariamente um segundo elemento;
- dobrar defesa contra uma familia de dano;
- transformar dano recebido em recurso;
- criar execucao abaixo de um limiar.

### Epica

Cartas que definem estilo de jogo por alguns turnos.

Exemplos:
- todos os ataques eletricos saltam para um segundo impacto;
- o usuario entra em postura de retaliacao;
- ataques passam a escalar com vida perdida;
- o inimigo perde acesso a buffs;
- uma escola inteira de magia fica enfraquecida.

### Lendaria

Cartas que mudam o estado da batalha de forma contundente.

Exemplos:
- campo persistente que triplica um elemento;
- forma especial com pacote de bonus;
- revive condicionado;
- arma que ignora metade das regras defensivas;
- cadeia de execucao, reflexo ou absorcao.

### Mitica

Cartas que criam uma realidade temporaria nova.

Exemplos:
- dominio;
- transformacao completa;
- acesso a dois elementos;
- invulnerabilidade parcial;
- dano verdadeiro prolongado;
- escolha entre efeitos absurdos.

### ???

Cartas quase proibidas. Devem parecer impossiveis, com limite forte, custo brutal ou uso unico.

Exemplos:
- parar o tempo;
- reescrever uma derrota;
- reduzir todos os participantes a um estado extremo;
- impedir a existencia de um resultado;
- subjugar o inimigo progressivamente ate ele deixar de jogar.

## Famílias mecanicas

Cada carta deve pertencer primariamente a uma familia para evitar redundancia:

1. **Golpe** — muda como um ataque acontece.
2. **Postura** — altera o usuario por alguns turnos.
3. **Campo** — muda a batalha inteira.
4. **Elemento** — cria afinidade, vantagem, conversao ou imunidade.
5. **Controle** — mexe em turno, skill, alvo ou sequencia.
6. **Marca** — prepara execucao, drenagem, explosao ou combo futuro.
7. **Transformacao** — muda o personagem por varios turnos.
8. **Destino** — revive, retorna, executa, reescreve, impede derrota.
9. **Invocacao** — adiciona ajuda, follow-up ou entidade persistente.
10. **Quebra de regra** — ignora defesa, ignora turno, ignora elemento, ignora morte.

## Regras de identidade

1. Nenhuma carta deve existir apenas como `dano + status`.
2. Se duas cartas fizerem quase a mesma coisa, uma delas deve ganhar:
   - condicao diferente;
   - recompensa diferente;
   - elemento diferente;
   - janela temporal diferente;
   - ou custo diferente.
3. Toda carta de Rara para cima deve responder claramente:
   - "o que ela permite fazer que nenhuma outra permite?"
4. Toda carta Mitica ou ??? deve ser reconhecivel apenas pelo texto do efeito, mesmo sem o nome.
5. Cartas comuns tambem precisam de fantasia, mas nao de grandeza.

## Elementos: como usar nas cartas

### Formas de interacao

- conceder afinidade elemental adicional;
- mudar o elemento do proximo ataque;
- fazer um elemento ignorar sua fraqueza natural;
- aumentar a efetividade apenas contra certos elementos;
- criar campo que fortalece um elemento e enfraquece outro;
- fazer um elemento aplicar uma regra nova;
- permitir que o usuario escolha entre dois elementos;
- punir inimigos que usem um elemento especifico.

### Exemplos

- **Half-Cold Half-Hot**: usuario ganha acesso a Fire e Ice enquanto equipada; pode escolher qual elemento aplicar a cada uso relevante.
- **Cruel Sun**: cria Sol; Fire recebe aumento massivo, Ice perde forca, talvez Grass mude de comportamento.
- **Water Breathing**: o proximo golpe de corte pode ser tratado como Water e ganha bonus se for super efetivo.
- **Ice Make**: cria estruturas; ataques Ice podem deixar muralhas, armas ou campo congelado conforme uso.

## Novas primitivas recomendadas no motor

### Estado de batalha

Adicionar ao `BattleContext`:

- `battlefieldEffects[]`
- `playerElementAffinities[]`
- `elementOverrides[]`
- `playerForms[]`
- `enemyMarks[]`
- `queuedFollowUps[]`
- `sealedEnemyActions[]`
- `executionRules[]`
- `oncePerBattleFlags`

### Exemplos de objetos

```ts
type BattlefieldEffect = {
  key: string;
  source: 'player' | 'enemy';
  turnsLeft: number;
  tags: string[];
  modifiers?: Record<string, number>;
};

type EnemyMark = {
  key: string;
  stacks: number;
  turnsLeft?: number;
  payload?: Record<string, unknown>;
};

type PlayerForm = {
  key: string;
  turnsLeft: number;
  grantsElements?: ElementType[];
  modifiers?: Record<string, number>;
  rules?: string[];
};
```

### Hooks necessarios

- `onBattleStart`
- `beforePlayerAttack`
- `afterPlayerAttack`
- `beforeEnemyAttack`
- `afterEnemyAttack`
- `onTurnStart`
- `onTurnEnd`
- `onLethalDamage`
- `onFieldEnter`
- `onEffectivenessCheck`

Sem esses hooks, as cartas futuras vao virar ifs soltos pelo engine.

## Direcao de progressao

### Faixas de impacto sugeridas

| Raridade | Sensacao |
|---|---|
| Comum | "isso melhora minha jogada" |
| Incomum | "isso cria um combo" |
| Rara | "isso muda como eu luto" |
| Epica | "isso define minha build" |
| Lendaria | "isso vira a luta" |
| Mitica | "isso cria outra realidade" |
| ??? | "isso nao deveria existir" |

## Recomendacao de processo

1. Definir as primitivas novas do motor.
2. Criar um vocabulario de efeitos suportados.
3. Reescrever primeiro 20 cartas-piloto cobrindo todas as familias mecanicas.
4. Validar se as cartas realmente parecem diferentes em jogo.
5. So depois expandir para as 136.

## Proximos blocos de trabalho

### Bloco A — arquitetura

- adicionar estados e hooks novos;
- documentar DSL/config de carta;
- permitir interacoes elementais avancadas.

### Bloco B — design

- fechar criterios de raridade;
- fechar familias mecanicas;
- redesenhar as 136 cartas em tabela.

### Bloco C — implementacao

- implementar primeiro as cartas-piloto;
- balancear em combate real;
- migrar o restante em ondas.
