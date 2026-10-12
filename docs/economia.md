# Economia com tudo junto (07/10)

Gerado por `npx vite-node scripts/economia.ts` (suposições no topo do script; duração dos duelos medida em `scripts/tcg-torre.ts`).

```
Moedas por hora

Torre, andar 1 (mesas, 1ª vez)             171/h  
Torre, andar 10                            250/h  
Torre, andar 20                            280/h  
Pesca                                      337/h  
Minijogos (enquanto há jogada paga)       1127/h  limite: 5 por jogo por dia (~188/dia em 2 jogos)
Entregas                                   340/h  limite: 5 por dia (~85/dia)

Aula típica de 90 min: ~552 moedas (2 aulas por semana: ~1104)

Quanto tempo para comprar (em aulas de 90 min)

Pacotinho Comum                               300    0.5 aulas
Pacotinho Incomum                             700    1.3 aulas
Pacotinho Raro                               1500    2.7 aulas
Pacotinho Épico                              4000    7.2 aulas
Pacotinho Lendário                          10000   18.1 aulas
Pacotinho Mítico                            25000   45.3 aulas
Tapete Circuito WIT                           600    1.1 aulas
Tapete Tatame do Dojo                         600    1.1 aulas
Tapete Noite Estrelada                        800    1.4 aulas
Tapete Chuva de Sakura                        800    1.4 aulas
Tapete Fundo do Mar                          1000    1.8 aulas
Tapete Coração do Vulcão                     1200    2.2 aulas
Tapete Arena dos Heróis                      1500    2.7 aulas
Tapete Floresta dos Espíritos                1500    2.7 aulas
Tapete Cidade Neon                           1500    2.7 aulas
Tapete Cartas Lendárias                      2000    3.6 aulas
Tapete Campo dos Monstrinhos                 2000    3.6 aulas
Sala: Escolher a música da aula               600    1.1 aulas
Sala: Tablet ou celular, 15 min               600    1.1 aulas
Sala: Escolher o lugar na sala                400    0.7 aulas
Sala: Ajudante do professor                   800    1.4 aulas
Sala: Óculos VR, 10 min                      2000    3.6 aulas
Sala: Peça na impressora 3D                  5000    9.1 aulas
Veículo: Patinete elétrico                    600    1.1 aulas
Veículo: Bicicleta                           1200    2.2 aulas
Veículo: Moto elétrica                       4000    7.2 aulas
Veículo: Carro elétrico                      9000   16.3 aulas
Veículo: Aviãozinho                         20000   36.2 aulas
```

## Leitura

- **Torre sozinha (só mesas): 170–280 moedas/h**; com o chefe a cada 4 mesas
  (`tcg-torre.ts`) fica em 300–540/h nos andares 1–15. Do andar 20 em diante o
  deck inicial perde para o chefe: é a hora de abrir pacotinho e forjar.
- **Pesca ~340/h** e **entregas ~340/h** estão um pouco acima das mesas: a pesca
  não tem limite. Se o TCG precisar ser o melhor caminho, o ajuste mais simples
  é subir a moeda das mesas (`coinsFor` em `opponents.ts`, hoje 6 + 0,4 × andar).
- **Minijogos rendem muito por minuto, mas têm limite** (5 jogadas pagas por
  jogo por dia): ~190 moedas/dia em 2 jogos. Não inflacionam.
- Uma aula de 90 min dá ~550 moedas: **um Pacotinho Comum por aula**, um Raro a
  cada 3 aulas, tapetes e Recompensas da Sala em 1–5 aulas. O Mítico (25 mil) e o
  aviãozinho (20 mil) são metas de semestre.
