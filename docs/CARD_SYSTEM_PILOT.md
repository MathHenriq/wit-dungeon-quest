# Cartas-piloto — novo sistema

Estas 20 cartas existem para testar o idioma mecanico do novo sistema antes de expandir para as 136. Elas cobrem golpe, postura, campo, elemento, controle, marca, transformacao, destino, invocacao e quebra de regra.

| Carta | Raridade | Familia | Efeito proposto | Interacao elemental | Necessidade do motor |
|---|---|---|---|---|---|
| Cruel Sun | Lendaria | Campo | Invoca o Sol por 5 turnos. Enquanto o Sol durar, ataques Fire do usuario causam 3x dano; ataques Ice causam metade; ao fim de cada turno o inimigo sofre queimadura solar crescente. | Fortalece Fire, enfraquece Ice. | battlefieldEffects, modificadores por campo, dano no fim do turno |
| Half-Cold Half-Hot | Mitica | Elemento / Forma | Enquanto equipada, o usuario ganha afinidade Fire e Ice. Uma vez por turno escolhe qual lado ativar: Fire aumenta dano progressivamente; Ice reduz o dano recebido e desacelera o inimigo. Alternar os lados no mesmo combate libera um golpe combinado. | Concede dois elementos e jogo de alternancia. | playerElementAffinities, playerForms, contador de alternancia |
| Erasure | Rara | Controle | Apaga uma habilidade inimiga escolhida ate o fim da batalha. Se apagar uma habilidade elemental, o inimigo tambem perde acesso ao bonus de afinidade daquele elemento por 3 turnos. | Interage com elemento da skill apagada. | erasedEnemyAbilityIds, selecao de alvo, affinities inimigas |
| Chain Jail | ??? | Marca / Execucao | Acorrenta o inimigo. Enquanto acorrentado, ele nao pode fugir nem ganhar buffs. Ao cair para 10% de HP ou menos, e executado imediatamente. | Neutra. | enemyMarks, executionRules, bloqueio de buffs |
| Titan Serum | Mitica | Transformacao | Transforma o usuario em titan por 4 turnos: HP maximo dobra, ataques viram Ground, todos os golpes causam impacto em area e o usuario nao pode esquivar. Ao terminar, volta com fadiga severa. | Troca ataques para Ground; ganha presenca de tanque. | playerForms, override de elemento, mudanca de HP maximo, drawback ao expirar |
| Dragon Force | Epica | Transformacao | Entra em Dragon Force por 4 turnos. O usuario escolhe um elemento ao ativar; ataques desse elemento ignoram resistencias e ganham bonus cada vez que acertam consecutivamente. | Especializa um elemento e quebra resistencia. | playerForms, elementOverrides, contador de sequencia |
| Full Counter | Lendaria | Postura / Controle | Por 3 turnos, o primeiro ataque especial recebido em cada turno e refletido ao inimigo com o dobro da forca. Ataques fisicos ainda atingem normalmente. | Pode refletir ataques elementais especiais. | counters condicionais por damageType, gatilho antes de dano |
| Sharingan | Epica | Copia / Controle | Copia a ultima skill usada pelo inimigo. Na proxima acao, o usuario pode replica-la com seu proprio poder e ignorando o requisito elemental original. | Permite usar temporariamente outro elemento. | copiedEnemyAbilityId, habilidade temporaria, bypass de requisito elemental |
| Mana Zone | Epica | Campo / Magia | Cria uma Zona de Mana por 4 turnos. Ataques Special do usuario nao podem errar, ignoram evasao e escolhem automaticamente o melhor angulo elemental disponivel. | Otimiza o elemento ofensivo disponivel. | battlefieldEffects, guaranteedHit, escolha de melhor elemento |
| Domain Expansion | ??? | Campo / Quebra de regra | Abre um dominio por 3 turnos. Dentro dele, toda acao ofensiva do usuario acerta. Ao ativar cada turno, o usuario escolhe entre Cleave (escala com HP atual) e Dismantle (escala com defesa inimiga). | Pode tratar ambos como slash neutro ou como elemento da build. | campo com subacoes, guaranteedHit, escolha por turno |
| Return by Death | ??? | Destino | Uma vez por batalha, se o usuario morrer, retorna ao inicio do turno anterior com HP cheio, buffs e debuffs como estavam no comeco daquele turno, mas o inimigo mantem a memoria e ganha agressividade. | Neutra. | snapshot de turno, rollback parcial, onLethalDamage |
| Time Stop | ??? | Quebra de regra | Para o tempo por 5 turnos do usuario. Durante esse periodo, o inimigo nao age, nao contra-ataca e nao recebe tick positivo; ao final, todos os danos acumulados resolvem de uma vez. | Neutra, mas combina brutalmente com setup elemental. | enemySkipTurns avancado, dano acumulado, congelar ticks |
| Ultra Instinct | Lendaria | Forma / Defesa | Por 4 turnos, o usuario desvia automaticamente de ataques diretos. Cada esquiva gera um contra-golpe com bonus crescente; ataques inevitaveis ainda acertam. | Contra-golpes usam o ultimo elemento ofensivo equipado. | autoDodgeTurnsLeft, follow-up por esquiva, flag de ataques inevitaveis |
| Murasame | Lendaria | Marca / Destino | Marca o inimigo com uma maldicao letal. Sempre que ele receber dano, a marca cresce. Ao atingir 5 cargas, o proximo golpe que o acertar ignora defesa e executa inimigos nao-boss abaixo de 35%. | Poison/Dark poderiam acelerar as cargas. | enemyMarks, stacks, executionRules |
| Stone Mask | Lendaria | Transformacao | Transforma o usuario em vampiro por 5 turnos: cura com parte de todo dano causado, ganha resistencia a dano fisico e se fortalece quando derrota um inimigo. Fica vulneravel a Fire e efeitos solares. | Fraqueza ampliada a Fire; talvez sinergia com Dark. | playerForms, lifesteal global, vulnerabilidade elemental |
| Hollow Purple | Mitica | Golpe / Quebra de regra | Dispara uma aniquilacao que remove uma porcentagem do HP atual e apaga shields, clones e barreiras antes do dano. Nao pode ser refletido. | Ignora matchup comum; funciona como ataque de colapso espacial. | trueDamage parcial, limpeza de protecoes, flag unreflectable |
| Water Breathing | Comum | Elemento / Golpe | O proximo golpe cortante torna-se Water. Se acertar um alvo contra o qual Water seja super efetivo, o usuario ganha um segundo corte mais fraco. | Conversao para Water e recompensa por explorar vantagem. | conversao temporaria de elemento, follow-up condicional |
| Ice Make | Comum | Invocacao / Defesa | Cria uma construcao de gelo a escolha: Lanca (proximo ataque ganha alcance e prioridade) ou Muralha (absorve parte do proximo dano). | Ice ganha versatilidade entre ataque e defesa. | escolha modal simples, queuedFollowUps ou shield temporario |
| Black Flash | Mitica | Golpe / Risco | Pode ser usado todo round. Causa dano colossal escalando com a sequencia de acertos, mas cada uso cobra parte do HP maximo do usuario. Errar quebra a sequencia. | Pode herdar o elemento do ultimo golpe corpo-a-corpo. | combo counter, custo em HP, streak reset |
| Requiem | ??? | Destino / Dominacao | Subjulga o inimigo. No primeiro turno, ele perde 5% do HP maximo; no segundo, 10%; no terceiro, 15%; a progressao continua enquanto Requiem permanecer ativo. Inimigos comuns nao conseguem remover o efeito. | Neutra. | battlefield curse persistente, escalonamento por turno |

## O que este piloto testa

### 1. Campo
- Cruel Sun
- Mana Zone
- Domain Expansion

### 2. Transformacao
- Titan Serum
- Dragon Force
- Stone Mask
- Ultra Instinct

### 3. Elementos
- Half-Cold Half-Hot
- Water Breathing
- Dragon Force
- Cruel Sun

### 4. Controle
- Erasure
- Full Counter
- Sharingan
- Time Stop

### 5. Marcas e execucao
- Chain Jail
- Murasame
- Requiem

### 6. Destino e realidade
- Return by Death
- Domain Expansion
- Hollow Purple
- Requiem

## Primeiras conclusoes de design

1. **Campo** sera uma das maiores fontes de identidade. Ele precisa virar conceito nativo do motor.
2. **Forma** tambem precisa ser nativa. Muitas das cartas mais desejadas naturalmente sao transformacoes.
3. **Elemento** nao pode ficar restrito a `ability.elementName`; o usuario precisa poder ganhar afinidades e sobrescrever elementos temporariamente.
4. **Marcas** sao essenciais para sair de status generico e criar cartas memoraveis.
5. **Raridades altas** funcionam melhor quando mudam a estrutura da luta, nao quando apenas aumentam numeros.

## Efeitos novos que o motor precisa suportar antes da escala total

1. `battlefieldEffects`
2. `playerForms`
3. `playerElementAffinities`
4. `enemyMarks`
5. `executionRules`
6. `queuedFollowUps`
7. `sealedEnemyActions`
8. `oncePerBattleFlags`
9. snapshot de turno para `Return by Death`
10. hooks:
   - `onBattleStart`
   - `beforePlayerAttack`
   - `afterPlayerAttack`
   - `beforeEnemyAttack`
   - `afterEnemyAttack`
   - `onTurnStart`
   - `onTurnEnd`
   - `onLethalDamage`
   - `onEffectivenessCheck`

## Proxima etapa recomendada

Depois de validar este piloto, o melhor proximo passo e reescrever as 136 cartas em uma planilha mestre com colunas:

- Carta
- Raridade final
- Familia
- Texto curto
- Efeito mecanico
- Elemento(s)
- Gatilho
- Duracao
- Limite
- Contrajogo
- Requisitos de engine
