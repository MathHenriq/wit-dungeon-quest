# Adequação à nota do Ministério Público e reforço de segurança (set/2026)

## Regra de dados do aluno

O sistema guarda do aluno **apenas**:

| Dado | Onde | Quem vê |
|---|---|---|
| E-mail | `auth.users` (login) | só o Supabase Auth |
| Dois primeiros nomes | `students.name` | o próprio aluno, o professor dele, o admin |
| Nickname do personagem | `students.character_name` | todos os alunos (rankings, trocas, guildas, PvP) |
| Grupo (código neutro) | `students.class_id` → `classes.name` = `GRUPO-XXXX` | aluno e professor |

Não existe mais: nome completo, escola (`school_name`), turma real, qualquer dado do
Google Sala de Aula (`classroom_email`, `classroom_user_id`, tokens OAuth, turmas
importadas), portal dos pais.

A regra dos dois nomes é imposta em três lugares: `src/lib/privacy.ts` (mensagem ao
aluno), `register_my_student()` (RPC de cadastro) e a constraint
`students_name_first_two`.

## Turmas → grupos

O nome do grupo é gerado pelo banco (trigger `classes_force_neutral_code`) e não
pode ser editado. O professor cria o grupo no painel e passa o código aos alunos em
sala; o mapeamento código ↔ turma real fica só com o professor, fora do sistema.

## Como um aluno vê outro

Só pela view `student_profiles`: nickname, classe, nível, XP e atributos. `name` na
view é o nickname. Turma e professor só aparecem quando são os mesmos de quem
consulta; foto nunca aparece. A tabela `students` só devolve a própria linha
(professor: os alunos dele; admin: todos).

## Segurança

- O papel `anon` (sem login) não lê nem escreve nenhum dado de aluno e não executa
  nenhuma RPC. O portal do aluno usa sempre a sessão autenticada.
- Escritas diretas exigem dono (`my_student_id()`), professor do aluno ou admin.
- RPCs que recebem `p_student_id` / `p_teacher_id` checam quem chama
  (`can_act_for_student`, `can_act_for_teacher`). Funções de job, trigger e
  auxiliares só executam pelo servidor.
- Login não informa mais se o e-mail existe (evita descobrir e-mails de alunos).
- Storage: cada aluno só escreve na própria pasta de `profile-photos`; listagem
  pública desligada; imagens da loja só por professores.

## Migrations (ordem)

1. `20260924200000_lgpd_remove_google_classroom.sql`
2. `20260924200100_lgpd_minimize_student_data.sql` — **irreversível**
3. `20260924200200_security_rls_hardening.sql`
4. `20260924200300_security_function_grants.sql`
5. `20260924200400_security_storage_policies.sql`

O frontend novo e as migrations precisam ir juntos: o portal antigo consulta como
`anon` e para de funcionar depois da migration 3.

## Pendências fora do código

- Remover a Edge Function `gsa-refresh-token` do projeto (Dashboard → Edge Functions)
  e reimplantar `admin-create-student`.
- Apagar do Google Cloud Console o client OAuth com escopos do Classroom, se não for
  mais usado para o login de professores.
- Ativar "Leaked password protection" em Auth → Settings.
- Cadastro de professor é aberto: qualquer pessoa cria conta de professor e aparece
  na lista do cadastro de alunos. Recomendado exigir aprovação do admin.
