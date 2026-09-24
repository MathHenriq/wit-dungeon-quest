import { supabaseStudent } from './studentClient';

// Antes este era um cliente SEM sessão, e todo o portal do aluno consultava o
// banco como `anon` — o que obrigava o RLS a liberar leitura e escrita
// anônimas em `students` e em dezenas de tabelas. Qualquer pessoa com a URL
// do site lia os nomes de todos os alunos.
//
// Agora o nome é mantido só por compatibilidade: aponta para o cliente com a
// sessão do aluno, então tudo roda como `authenticated` e o RLS pode exigir
// dono. O papel `anon` não tem mais acesso a dado de aluno nenhum.
export const supabaseAnon = supabaseStudent;
