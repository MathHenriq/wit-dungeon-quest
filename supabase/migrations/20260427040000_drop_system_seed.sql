-- Seed do sistema de drops: ~100 itens temáticos distribuídos pelos 11 temas
-- de floor existentes (forest, cave, fire, tower, swamp, fortress, plains,
-- labyrinth, ruins, temple, citadel).
--
-- Distribuição alvo de raridade:
--   comum 45% / incomum ~25% / raro ~15% / epico ~8%
--   lendario ~4% / mitico ~2% / ??? ~1%
-- Sell values respeitam as faixas fixas definidas no prompt do produto.

-- =====================================================================
-- DROP_ITEMS
-- =====================================================================

INSERT INTO public.drop_items (name, description, rarity, floor_theme, base_sell_value) VALUES
-- ---------- forest (12) ----------
('Pelo de Lobo',          'Tufo grosso de pelo cinzento, ainda quente.',                 'comum',    'forest',  6),
('Garra Quebrada',         'Garra lascada de uma fera da floresta.',                     'comum',    'forest',  8),
('Presa de Aranha',        'Presa oca, manchada de seiva venenosa.',                     'comum',    'forest',  9),
('Asa de Morcego Sombrio', 'Membrana fina e correosa.',                                  'comum',    'forest', 10),
('Folha Sussurrante',      'Continua a sussurrar mesmo arrancada.',                      'comum',    'forest',  7),
('Casca de Treant',        'Pedaço de casca antiga, ainda áspera.',                      'comum',    'forest', 12),
('Olho de Aranha Venenosa','Reflete imagens distorcidas do que vê.',                     'incomum',  'forest', 28),
('Seiva Antiga',           'Resina dourada extraída de raízes muito antigas.',           'incomum',  'forest', 34),
('Coração de Treant',      'Núcleo de madeira que pulsa devagar.',                       'raro',     'forest', 65),
('Veneno Cristalizado',    'Cristal âmbar com veneno suspenso dentro.',                  'raro',     'forest', 72),
('Dente de Fenrir',        'Dente curvo de uma fera mítica dos bosques.',                'epico',    'forest',135),
('Essência da Floresta',   'Luz verde aprisionada num frasco de orvalho.',               'lendario', 'forest',225),

-- ---------- cave (17) ----------
('Fragmento de Pedra',     'Pedaço bruto, pesa mais do que aparenta.',                   'comum',    'cave',    5),
('Pó de Cristal',           'Pó fino que brilha levemente no escuro.',                   'comum',    'cave',    7),
('Lasca de Quartzo',        'Translúcida e cortante.',                                   'comum',    'cave',    8),
('Calcário Sombrio',        'Bloco poroso com manchas escuras.',                         'comum',    'cave',    6),
('Eco Petrificado',         'Pedra que ressoa um sussurro distante.',                    'comum',    'cave',   10),
('Olho Cego',               'Olho de criatura subterrânea, ainda úmido.',                'comum',    'cave',   11),
('Membrana Subterrânea',    'Tecido fino retirado de uma criatura cega.',                'comum',    'cave',    9),
('Casco Quebrado',          'Fragmentos de carapaça mineralizada.',                      'comum',    'cave',   12),
('Cristal Bruto',           'Bloco de cristal sem lapidar, com falhas internas.',        'incomum', 'cave',   30),
('Núcleo de Rocha',         'Esfera densa retirada do peito de um golem.',               'incomum', 'cave',   36),
('Geode Trincada',          'Geode parcialmente aberta, fria ao toque.',                 'incomum', 'cave',   33),
('Cristal de Abismo',       'Cristal preto que devora a luz.',                           'raro',     'cave',   60),
('Coração de Pedra',        'Núcleo cristalizado de um colosso.',                        'raro',     'cave',   75),
('Geode Perfeita',          'Cavidade interna alinhada em ângulos impossíveis.',         'raro',     'cave',   68),
('Estalactite Sagrada',     'Formação que pinga uma água que jamais seca.',              'raro',     'cave',   78),
('Fragmento de Colosso',    'Pedaço de carapaça de uma criatura ancestral.',             'epico',    'cave',  140),
('Olho do Abismo',          'Esfera escura que parece olhar de volta.',                  'lendario', 'cave',  240),

-- ---------- fire (9) ----------
('Cinza Vulcânica',         'Pó cinza ainda morno ao toque.',                            'comum',    'fire',    7),
('Brasa Apagada',           'Pequeno carvão que reacende quando soprado.',               'comum',    'fire',    9),
('Escama Carbonizada',      'Escama enegrecida pelo fogo prolongado.',                   'comum',    'fire',   11),
('Pó de Enxofre',           'Pó amarelo de cheiro acre.',                                'comum',    'fire',    8),
('Escória Ardente',         'Resíduo metálico que ainda emite calor.',                   'incomum', 'fire',   32),
('Sangue de Salamandra',    'Líquido escarlate que ferve ao ar livre.',                  'incomum', 'fire',   38),
('Cristal de Brasa',        'Cristal vermelho com chama presa em seu centro.',           'raro',     'fire',   70),
('Lágrima de Magma',        'Gota endurecida de magma puro.',                            'raro',     'fire',   76),
('Coração de Magma',        'Núcleo pulsante extraído do centro de uma fornalha.',       'epico',    'fire',  148),

-- ---------- tower (9) ----------
('Página Rasgada',          'Folha solta com símbolos meio apagados.',                   'comum',    'tower',  10),
('Pena Antiga',              'Pena que ainda escreve sozinha por um instante.',          'comum',    'tower',   8),
('Tinta Espectral',          'Tinta que evapora em contato com a luz.',                  'comum',    'tower',  12),
('Resíduo de Função',        'Fragmento de runa lógica recém quebrada.',                 'comum',    'tower',  11),
('Pergaminho Selado',        'Pergaminho lacrado por uma sigila desconhecida.',          'incomum', 'tower',  35),
('Cristal de Memória',       'Cristal que preserva uma cena curta em loop.',             'incomum', 'tower',  39),
('Tomo da Função Pura',      'Livro onde cada página retorna a mesma resposta.',         'raro',     'tower',  72),
('Fragmento Algorítmico',    'Esboço cristalino de um algoritmo perfeito.',              'raro',     'tower',  66),
('Selo do Arquiteto',        'Insígnia gravada com uma equação infinita.',               'epico',    'tower', 142),

-- ---------- swamp (9) ----------
('Lodo Corrompido',          'Massa viscosa que se reforma quando cortada.',             'comum',    'swamp',   6),
('Bolha de Erro',            'Bolha que estoura repetindo a mesma sílaba.',              'comum',    'swamp',   8),
('Lama de Tipo',             'Lama com cores que jamais combinam.',                      'comum',    'swamp',   7),
('Cogumelo Fétido',          'Cogumelo cujo cheiro persiste por horas.',                 'comum',    'swamp',   9),
('Veneno de Pântano',        'Líquido turvo que escorre devagar.',                       'incomum', 'swamp',  29),
('Esporo Mutante',           'Esporo que muda de forma a cada hora.',                    'incomum', 'swamp',  37),
('Núcleo Pantaneiro',        'Pedra fria coberta por musgo escuro.',                     'raro',     'swamp',  62),
('Casca Duplicada',          'Casca onde cada metade é cópia exata da outra.',           'raro',     'swamp',  70),
('Coração do Pântano Eterno','Órgão preservado num lodo que jamais seca.',               'mitico',  'swamp', 360),

-- ---------- fortress (9) ----------
('Engrenagem Quebrada',      'Engrenagem com dentes faltando.',                          'comum',    'fortress',  7),
('Parafuso Antigo',          'Parafuso enferrujado, mas ainda firme.',                   'comum',    'fortress',  5),
('Chip de Recursão',         'Chip que repete o último sinal indefinidamente.',          'comum',    'fortress', 11),
('Lâmina Binária',           'Lâmina afiada apenas em ângulos pares.',                   'comum',    'fortress', 13),
('Núcleo Algorítmico',       'Núcleo que pulsa em padrões reconhecíveis.',               'incomum', 'fortress', 36),
('Placa Lógica',             'Placa metálica gravada com circuitos vivos.',              'incomum', 'fortress', 33),
('Esfera de Complexidade',   'Esfera cujo peso muda conforme observada.',                'raro',     'fortress', 74),
('Engrenagem Mestre',        'Engrenagem central de uma máquina antiga.',                'raro',     'fortress', 67),
('Insígnia do Comandante',   'Insígnia gravada do regente do algoritmo.',                'epico',    'fortress',138),

-- ---------- plains (7) ----------
('Cabo de Rede Cortado',     'Cabo seccionado, ainda com pulso fraco.',                  'comum',    'plains',    6),
('Pacote de Dados',          'Pequeno embrulho de dados não entregues.',                 'comum',    'plains',    9),
('Fragmento de API',         'Fragmento que repete a mesma chamada.',                    'comum',    'plains',   10),
('Token de Sessão',          'Token expirado, mas ainda quente ao toque.',               'incomum', 'plains',   31),
('Daemon Aprisionado',       'Frasco lacrado com um processo bem pequeno dentro.',       'incomum', 'plains',   38),
('Servidor Cristalizado',    'Mini-servidor encapsulado em quartzo.',                    'raro',     'plains',   76),
('Coração da Distribuição',  'Núcleo onde mil processos pulsam juntos.',                 'epico',    'plains',  146),

-- ---------- labyrinth (7) ----------
('Galho de Decisão',         'Galho que se ramifica de formas impossíveis.',             'comum',    'labyrinth', 8),
('Folha de IF',              'Folha que muda de cor quando observada.',                  'comum',    'labyrinth', 7),
('Migalha de Caminho',       'Migalha deixada para marcar uma rota perdida.',            'comum',    'labyrinth', 6),
('Pena de Caso Extremo',     'Pena que aponta sempre para fora do mapa.',                'incomum', 'labyrinth',32),
('Cristal de SWITCH',        'Cristal multifacetado, cada face uma escolha.',            'incomum', 'labyrinth',39),
('Bússola do Labirinto',     'Bússola cujo norte muda a cada passo.',                    'raro',     'labyrinth',73),
('Fio de Ariadne',           'Fio que jamais embaraça, mesmo enrolado.',                 'lendario', 'labyrinth',230),

-- ---------- ruins (7) ----------
('Cinza Algorítmica',        'Pó frio de uma inteligência consumida.',                   'comum',    'ruins',     7),
('Caco de Caixa-Preta',      'Caco que reflete decisões esquecidas.',                    'comum',    'ruins',    11),
('Fragmento de Modelo',      'Fragmento de um modelo treinado e abandonado.',            'comum',    'ruins',    10),
('Pesos Desalinhados',       'Conjunto de pesos que jamais convergem.',                  'incomum', 'ruins',    34),
('Vetor Enviesado',          'Vetor que aponta sempre para o mesmo lado.',               'incomum', 'ruins',    36),
('Coração do Oráculo',       'Núcleo de uma IA que via demais.',                         'epico',    'ruins',   145),
('Resíduo Inominável',       'Não há registros sobre o que isso é.',                     '???',      'ruins',   555),

-- ---------- temple (6) ----------
('Tabuleta Sagrada',         'Pedra com instruções gravadas em SQL antigo.',             'comum',    'temple',    9),
('Pó de Índice',             'Pó organizado em camadas alfabéticas.',                    'comum',    'temple',    8),
('Caco de Registro',         'Caco contendo um único campo legível.',                    'comum',    'temple',   11),
('Vela do JOIN',             'Vela cuja chama se divide em duas e volta.',               'incomum', 'temple',   33),
('Selo Único',               'Selo que recusa qualquer duplicata.',                      'incomum', 'temple',   38),
('Cálice do Sumo SQL',       'Cálice que enche-se com a consulta certa.',                'raro',     'temple',   77),

-- ---------- citadel (6) ----------
('Sinapse Quebrada',         'Sinapse que ainda dispara fracamente.',                    'comum',    'citadel',  10),
('Peso Inicializado',        'Peso ainda não treinado, frio ao toque.',                  'comum',    'citadel',   9),
('Gradiente Disperso',       'Pó que aponta vagamente para o erro mínimo.',              'comum',    'citadel',  12),
('Função de Ativação',       'Pequena chama que liga e desliga ritmadamente.',           'incomum', 'citadel',  37),
('Núcleo de Convolução',     'Núcleo que reorganiza tudo ao redor em padrões.',          'incomum', 'citadel',  39),
('Singularidade Inerte',     'Ponto único onde toda a aprendizagem colapsou.',           'mitico',  'citadel', 380);

-- =====================================================================
-- ENEMY_DROP_TABLE
-- =====================================================================
-- Lógica:
--  - cada inimigo recebe entradas para drops do mesmo tema do seu floor
--  - chance/quantidade variam por raridade
--  - drops 'epico' / 'lendario' / 'mitico' / '???' apenas em bosses
--  - quantidade máxima diminui conforme aumenta a raridade

INSERT INTO public.enemy_drop_table (enemy_id, drop_item_id, drop_chance, min_quantity, max_quantity)
SELECT
  e.id,
  di.id,
  CASE di.rarity
    WHEN 'comum'    THEN 0.45
    WHEN 'incomum'  THEN 0.18
    WHEN 'raro'     THEN CASE WHEN e.is_boss THEN 0.20 ELSE 0.05 END
    WHEN 'epico'    THEN 0.08
    WHEN 'lendario' THEN 0.03
    WHEN 'mitico'   THEN 0.01
    WHEN '???'      THEN 0.005
  END AS drop_chance,
  1 AS min_quantity,
  CASE di.rarity
    WHEN 'comum'   THEN 3
    WHEN 'incomum' THEN 2
    ELSE 1
  END AS max_quantity
FROM public.enemies e
JOIN public.floors     f  ON f.id = e.floor_id
JOIN public.drop_items di ON di.floor_theme = f.theme
WHERE
  -- não-bosses só ganham drops até 'raro'
  (e.is_boss OR di.rarity IN ('comum', 'incomum', 'raro'))
ON CONFLICT (enemy_id, drop_item_id) DO NOTHING;
