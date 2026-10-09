# Os professores do WIT dentro do jogo

> Escrito em 09/10/2026. Ideia do Matheus: cada sala do Núcleo WIT na Cidade WIT tem por
> dentro os **professores de verdade**, e são eles que entregam as tarefas daquele curso.
> "Estou jogando um jogo que representa a minha vida real: o meu professor está ali."

---

## 1. O que existe hoje

Na Cidade WIT, a porta de cada prédio de curso **abre direto o painel de trabalho**
(`WORK_DOORS` em `CityDemo.tsx`): não há sala por dentro, nem ninguém entregando a tarefa.
O único "professor" é um morador genérico chamado "Professor" na praça (`content.ts`).

---

## 2. Quem fica em cada sala

Pelo que o Matheus disse (a confirmar, §6):

| Sala (prédio que já existe) | Curso | Professores | Tarefas que eles entregam (já existem) |
|---|---|---|---|
| Estúdio de Comunicação (`estudio`) | Comunicação Digital | **Prof. Gabriel, Prof. Matheus Camilo, Profa. Joyce** | escrever matéria, jornalzinho, fato ou boato, notícia, entrevista (no mapa) |
| Laboratório de IA (`lab-ia`) | Inteligência Artificial | **Prof. Matheus Macedo, Profa. Mayara, Prof. Dante** | programar o robô, testar o modelo, rotular dados, caça aos dados (no mapa) |
| Casa Inteligente (`casa-iot`) | IoT | *a definir* | regra SE/ENTÃO, circuito, instalar sensores e conserto dos postes (no mapa) |
| Metaverso (`metaverso`) | Metaverso | *a definir* | coordenadas 3D, Sala Virtual, pares 3D, escanear a cidade (no mapa) |
| Oficina de Games (`oficina-games`) | Oficina de Games | *a definir* | lógica do jogo, teste de jogo, caça-bugs (no mapa) |

Trabalhos que não são do WIT (Padaria da Dona Rosa, Doces da Dona Ana, Casa de Pesca,
Fazenda) continuam com **um morador só** entregando, como o Matheus pediu.

---

## 3. Como funciona

### A sala por dentro
Cada prédio de curso ganha um **interior** (o motor de salas já monta interiores com o
atlas de móveis: `residentRoom` em `room.ts`): mesas, quadro, computadores, a cara do
curso. Os professores ficam **cada um na sua mesa**. Falar com um professor abre as
tarefas dele (o mesmo painel de trabalho de hoje, agora entregue por uma pessoa).

### Plantão no dia em que dá aula de verdade
Com 3 professores por sala, cada um fica **"de plantão" nos dias em que dá aula de
verdade** (terça: Profa. Mayara no Lab; quinta: Prof. Dante...). Os outros aparecem só de
passagem. O jogo espelha a semana real da escola.

### O seu professor te reconhece
O aluno já pertence à turma de um professor (o banco separa tudo por professor). Quando
ele entra na sala, **o próprio professor dele** está lá e cumprimenta pelo apelido:
> "E aí, <apelido>! Bom te ver depois da aula de terça."

### Recado da semana
No painel do professor (que já existe), um campo **"Recado no jogo"**: o professor
escreve uma frase curta e o boneco dele fala isso para a turma dele na semana. As
**Missões da sala** (que já existem) passam a ser entregues no jogo **pela boca do
professor**, não por um aviso.

### A aparência
O boneco de cada professor é montado no **editor de personagem** do jogo (modelo, pele,
cabelo, roupa, acessórios), de preferência **pelo próprio professor ou junto com ele**.
Nada de foto. Plaquinha com o nome e o curso: "Profa. Joyce · Comunicação Digital".

### Na história
O Núcleo WIT é, na história, quem continua a missão da Professora Aurora: ensinar
(`docs/historia.md`). Os professores são **mentores** nos capítulos:

| Capítulo | Quem ajuda |
|---|---|
| 3 · Boatos | Comunicação Digital: como checar uma notícia |
| 6 · O Robô que Lembra | IA: achar os exemplos errados no treino do WIT-Bot |
| 9 · O Homem que Não Molha | Comunicação + Metaverso + IoT: vídeo falso, holograma, detector |
| 10 · Faísca | IoT: o circuito do farol |
| 14 · A Subida | Oficina de Games: a fase da Escada do Farol |
| 15 · Andar Zero | IA: o re-treino do ECO |

---

## 4. Cuidados

1. **Autorização por escrito** de cada professor para usar nome e boneco no jogo
   (é a imagem de uma pessoa real num jogo para crianças). Quem não quiser, não entra.
   Passar pelo cuidado de dados que outra sessão está fazendo (`docs/LGPD_SEGURANCA.md`).
2. **Professor saiu do WIT?** Uma chave `ativo: false` tira o boneco na hora. Todos os
   professores ficam num arquivo só de configuração.
3. **Nunca vilão, nunca piada, nunca preso em carta.** Só mentor.
4. **As falas fixas** de cada professor são aprovadas por ele. O recado da semana é
   escrito por ele mesmo.
5. Nenhum dado do professor além do nome que ele escolher (sem sobrenome, se preferir).

---

## 5. Construção

| Passo | O quê |
|---|---|
| 1 | `src/game/world/professores.ts`: lista com nome, curso, sala, visual (`Look`), dias de plantão, falas, `ativo` |
| 2 | Interior das 5 salas do WIT (atlas de móveis; pode pedir peças de laboratório ao GPT) |
| 3 | Porta do curso leva à sala; falar com o professor abre o trabalho (o `WORK_DOORS` vira a lista de tarefas de cada professor) |
| 4 | Plantão por dia da semana; cumprimento do professor da turma pelo apelido |
| 5 | Campo "Recado no jogo" no painel do professor (banco: uma coluna na turma) e Missões da sala entregues pelo boneco |

---

## 6. O que preciso do Matheus

1. **Confirmar a lista.** Entendi "no dia A" como "**na de IA**" (Prof. Matheus Macedo,
   Profa. Mayara, Prof. Dante no Lab de IA). Está certo?
2. **Professores de IoT, Metaverso e Oficina de Games.**
3. **Dias de aula** de cada um (para o plantão).
4. Cada professor topa e monta o próprio boneco?
