-- Atomic student merge: transfers user_id from a pending record to an existing
-- manually-created record, then deletes the pending record.
--
-- Why a function instead of two client-side calls:
--   The user_id column has a UNIQUE constraint. Updating the existing record
--   before deleting the pending one causes a constraint violation because both
--   rows temporarily share the same user_id. Running everything inside a single
--   transaction with an intermediate NULL step avoids this.

CREATE OR REPLACE FUNCTION public.merge_student(p_pending_id UUID, p_existing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_class_id UUID;
BEGIN
  SELECT user_id, class_id INTO v_user_id, v_class_id
  FROM public.students
  WHERE id = p_pending_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aluno pendente não encontrado ou já processado';
  END IF;

  IF NOT public.is_teacher_of_class(v_class_id) THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;

  -- Release the unique constraint on the pending record before transferring
  UPDATE public.students SET user_id = NULL WHERE id = p_pending_id;

  -- Activate the existing (manually-created) record and link the OAuth account
  UPDATE public.students
  SET user_id = v_user_id, status = 'active'
  WHERE id = p_existing_id;

  -- Remove the now-redundant pending record
  DELETE FROM public.students WHERE id = p_pending_id;
END;
$$;
