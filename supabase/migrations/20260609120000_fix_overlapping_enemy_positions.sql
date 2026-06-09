-- ============================================================
-- Patch — Fix overlapping enemy markers (floor soft-lock)
--
-- Density clones (Patch 2.2) were inserted at the (50,50) sentinel.
-- The client fallback that was meant to spread them is non-deterministic
-- and its hard-coded coords collided with hand-authored enemies, so two
-- markers ended up stacked. The collision check always triggers the first
-- enemy in the stack, leaving the other permanently undefeated -> the boss
-- never unlocks and the floor cannot be cleared (reported on floor 7, and
-- present on every floor that received density clones, 7-25).
--
-- This assigns each (50,50) enemy a real, non-overlapping position so no two
-- markers are within collision range. Idempotent: once moved off (50,50)
-- these rows no longer match and re-running is a no-op.
-- ============================================================

-- Floor 1
UPDATE public.enemies SET position_x = 20, position_y = 78 WHERE id = '73d62cde-28b9-4eb0-b53d-5595443c0694'; -- Cobra Venenosa II
-- Floor 2
UPDATE public.enemies SET position_x = 20, position_y = 78 WHERE id = 'b04ce96f-8582-4067-aff6-5374b8186c75'; -- Besta Ancestral II
-- Floor 3
UPDATE public.enemies SET position_x = 20, position_y = 78 WHERE id = 'a0046887-f8d8-4f60-ab7f-843ad1f0f572'; -- Criatura do Abismo II
-- Floor 4
UPDATE public.enemies SET position_x = 20, position_y = 78 WHERE id = 'abaac8b2-0dcd-4218-b023-ccf788e257c2'; -- Aberração Arcana II
-- Floor 5
UPDATE public.enemies SET position_x = 20, position_y = 78 WHERE id = '812877a2-df24-4ad0-98ab-bd4092f5718d'; -- Assombração Antiga II
-- Floor 6
UPDATE public.enemies SET position_x = 40, position_y = 80 WHERE id = '78467cc1-ccfb-40cc-aada-c6e02549fab6'; -- Elemental de Brasa II
-- Floor 7
UPDATE public.enemies SET position_x = 40, position_y = 80 WHERE id = 'ea4216c9-07b1-49a3-93d1-b52a38d9fbe7'; -- Espectro do Erro de Sintaxe II
-- Floor 8
UPDATE public.enemies SET position_x = 40, position_y = 80 WHERE id = 'cf060e1f-a077-4d8b-bb80-a8537b154a59'; -- Espírito da Função Pura II
-- Floor 9
UPDATE public.enemies SET position_x = 40, position_y = 80 WHERE id = 'c869ceeb-fd15-4a2b-9b14-057c33336b51'; -- Criatura do Valor Nulo II
-- Floor 10
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = 'daa59204-243f-400e-816a-093ff507b718'; -- Arqueiro do Bubble Sort II
-- Floor 11
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = 'f5d532cc-eb69-4157-9e05-ae16546f68c7'; -- Agente de API II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = 'c1e7907b-30dd-4f79-845c-65a0e7a44f79'; -- Agente de API III
-- Floor 12
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = '422e5077-469d-4fd4-bb6f-090a5839e19f'; -- Criatura do ELSE II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = '1b600c81-be84-4ce3-873e-a41933f94f82'; -- Criatura do ELSE III
-- Floor 13
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = '71d1b22c-665e-474c-8a63-c769f492f996'; -- Autômato Sem Objetivo II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = 'b49b1813-1fbc-45af-a8ac-b53ecb70276a'; -- Autômato Sem Objetivo III
-- Floor 14
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = '3c0cefba-09cf-4ba3-afef-ae925a92dcee'; -- Corrompedor de Índice II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = 'e05a831b-fdc9-403a-abf2-9a5b75e76790'; -- Corrompedor de Índice III
-- Floor 15
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = '1b11755e-f0a7-4e71-ab98-598849ba0ad3'; -- Classificador Binário II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = '6c44cc33-91b5-425b-b312-c0f156c437e7'; -- Classificador Binário III
-- Floor 16
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = 'e453f6ba-a773-489c-9252-1ab02697aac7'; -- Elemental de Lava II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = '688a329d-50f9-4925-b7e1-0ffcb45b1395'; -- Elemental de Lava III
-- Floor 17
UPDATE public.enemies SET position_x = 40, position_y = 80 WHERE id = '312f8799-642e-436f-a257-1ade46a1d6df'; -- Coruja Necromante II
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = 'e7355171-9f0b-43e1-88ae-0c1c40986a77'; -- Coruja Necromante III
-- Floor 18
UPDATE public.enemies SET position_x = 20, position_y = 78 WHERE id = 'cb63c194-e425-4c6a-bf96-5c7ab4f253d2'; -- Lobo de Cristal II
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = 'fda43454-612c-4b74-a2b4-a88d621e33aa'; -- Lobo de Cristal III
-- Floor 19
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = '13750c6c-9c1b-489c-ba82-6432a941adb2'; -- Tubarão Espectral II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = 'dd212985-75be-4aa9-a030-56adba71d2ea'; -- Tubarão Espectral III
-- Floor 20
UPDATE public.enemies SET position_x = 40, position_y = 80 WHERE id = '52e97da7-79ee-4fab-b7ea-0527371644d3'; -- Fênix Menor II
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = 'dbe607c5-8f77-4939-8250-f9ff7bf19b9e'; -- Fênix Menor III
-- Floor 21
UPDATE public.enemies SET position_x = 20, position_y = 78 WHERE id = 'd25a0b56-8189-4b66-b4da-7bda8435df56'; -- Múmia Amaldiçoada II
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = 'c5a29247-cb52-462d-bbf5-e58172a7ded2'; -- Múmia Amaldiçoada III
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = '23907a19-907c-4fd6-8a9d-96f2bb3c7bca'; -- Múmia Amaldiçoada IV
-- Floor 22
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = 'c4eb119f-4993-4a85-bd8d-b36241236ff4'; -- Colosso Enferrujado II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = '5d2e62cc-6000-4189-b799-668955233550'; -- Colosso Enferrujado III
UPDATE public.enemies SET position_x = 72, position_y = 55 WHERE id = '1aea14f0-c2f2-4035-b42d-60ba5d7c8694'; -- Colosso Enferrujado IV
-- Floor 23
UPDATE public.enemies SET position_x = 40, position_y = 80 WHERE id = 'b8f60c15-d93b-4564-bd1a-551dd4468200'; -- Hidra Relampejante II
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = '86019834-0216-4716-b7d3-651c4c82995b'; -- Hidra Relampejante III
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = '46697d0d-ea90-4f79-aadf-0bf338a8b4d3'; -- Hidra Relampejante IV
-- Floor 24
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = '24f4dbc1-b77b-4256-bfc9-7570ca905c84'; -- Serpente do Caos II
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = 'c1a8a0fa-aafe-4a96-a58a-02588c57f710'; -- Serpente do Caos III
UPDATE public.enemies SET position_x = 72, position_y = 55 WHERE id = '21e47921-a9a3-415f-b3bc-f7719ba21eb4'; -- Serpente do Caos IV
-- Floor 25
UPDATE public.enemies SET position_x = 40, position_y = 80 WHERE id = 'ae8eb964-35a2-4465-8f7b-d6352155b23f'; -- Sentinela do Trono II
UPDATE public.enemies SET position_x = 62, position_y = 80 WHERE id = '07b6800f-a20a-4d77-b046-54c80055426e'; -- Sentinela do Trono III
UPDATE public.enemies SET position_x = 80, position_y = 72 WHERE id = '249ea3f1-7b35-464b-bfbd-627f7f8c8044'; -- Sentinela do Trono IV

NOTIFY pgrst, 'reload schema';
