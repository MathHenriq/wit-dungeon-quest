-- ============================================================
-- Google Classroom Integration
-- Migration: 20260321020000_google_classroom.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.google_classroom_connections (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id       UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  access_token     TEXT        NOT NULL,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes           TEXT[]      NOT NULL DEFAULT '{}',
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_at     TIMESTAMPTZ,
  UNIQUE(teacher_id)
);

ALTER TABLE public.google_classroom_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own connection"
  ON public.google_classroom_connections
  FOR ALL TO authenticated
  USING (teacher_id = get_teacher_id())
  WITH CHECK (teacher_id = get_teacher_id());
