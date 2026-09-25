# Adequação à nota do Ministério Público e reforço de segurança (set/2026)

## Regra de dados do aluno

O sistema guarda do aluno **apenas**:

| Dado | Onde | Quem vê |
|---|---|---|
| E-mail | `auth.users` (login) | só o Supabase Auth |
| Dois primeiros nomes | `students.name` | o próprio aluno, o professor dele, o admin |
| Nickname do personagem | `students.character_name` | todos os alunos (rankings, trocas, guildas, PvP) |
| Professor | `students.teacher_id` | aluno e professor |

Não existe mais: nome completo, escola (`school_name`), turma (a tabela `classes` e
todas as colunas `class_id` foram apagadas em 25/09/2026), qualquer dado do
Google Sala de Aula (`classroom_email`, `classroom_user_id`, tokens OAuth, turmas
importadas), portal dos pais.

A regra dos dois nomes é imposta em três lugares: `src/lib/privacy.ts` (mensagem ao
aluno), `register_my_student()` (RPC de cadastro) e a constraint
`students_name_first_two`.

## Sem turmas

O aluno escolhe só o professor. Tudo que era "da turma" passou a ser "do professor":
rankings ("Colegas"), trocas, PvP, feed, chefões, cápsula do tempo, analytics.
Guerra de turmas e comparação entre turmas foram removidas. O ranking semanal
"sala" deixou de existir; o "geral" já é por professor.

## Como um aluno vê outro

Só pela view `student_profiles`: nickname, classe, nível, XP e atributos. `name` na
view é o nickname. O professor só aparece quando é o mesmo de quem consulta;
foto nunca aparece. A tabela `students` só devolve a própria linha
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

Todas aplicadas em produção em 24/09/2026.

1. `20260924200000_lgpd_remove_google_classroom.sql`
2. `20260924200100_lgpd_minimize_student_data.sql` — **irreversível**
3. `20260924200150_lgpd_nickname_without_real_name.sql` — 66 alunos usavam o
   próprio nome no nickname (público); voltaram para "Aventureiro XXXX"
4. `20260924200200_security_rls_hardening.sql`
5. `20260924200300_security_function_grants.sql`
6. `20260924200400_security_storage_policies.sql`
7. `20260924200500_security_fix_null_authz.sql` — achado no teste pós-deploy:
   `NULL` nas checagens deixava aluno ler analytics de professor
8. `20260925120000_remove_classes.sql` — remove turmas por completo (25/09/2026)

Verificado depois de aplicar, simulando os papéis no banco:
- sem login: 0 alunos, 0 professores; catálogo do jogo continua público;
- aluno: lê só a própria linha; vê 673 perfis públicos, sem foto e sem nome real;
  não altera as próprias moedas nem as de outro aluno; não chama RPC em nome de
  outro aluno nem analytics de professor;
- professor: lê os próprios alunos e o próprio analytics.

O frontend novo e as migrations precisam ir juntos: o portal antigo consulta como
`anon` e para de funcionar depois da migration 3.

## Pendências fora do código

- Apagar a Edge Function `gsa-refresh-token` no Dashboard (já foi esvaziada: só
  responde 410). `admin-create-student` já foi reimplantada.
- 7 dos 11 professores têm `is_admin = true`, e admin vê todos os alunos de todos
  os professores. Revisar quem realmente precisa ser admin.
- Apagar do Google Cloud Console o client OAuth com escopos do Classroom, se não for
  mais usado para o login de professores.
- Ativar "Leaked password protection" em Auth → Settings.
- Cadastro de professor é aberto: qualquer pessoa cria conta de professor e aparece
  na lista do cadastro de alunos. Recomendado exigir aprovação do admin.
