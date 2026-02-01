-- 1. Política para permitir qualquer um ler turmas (para dropdown do aluno)
CREATE POLICY "Anyone can read classes for login"
ON public.classes
FOR SELECT
USING (true);

-- 2. Expandir tabela students com campos de customização de personagem
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS race text,
ADD COLUMN IF NOT EXISTS character_class text,
ADD COLUMN IF NOT EXISTS motivation text,
ADD COLUMN IF NOT EXISTS lore text,
ADD COLUMN IF NOT EXISTS appearance text,
ADD COLUMN IF NOT EXISTS personality text;

-- 3. Adicionar campo de imagem na tabela shop_items
ALTER TABLE public.shop_items
ADD COLUMN IF NOT EXISTS image_url text;