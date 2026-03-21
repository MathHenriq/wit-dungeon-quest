# Google Classroom Integration Setup

## Pré-requisitos

- Conta Google Workspace ou conta Google pessoal com acesso ao Google Classroom
- Acesso ao Google Cloud Console
- Projeto Supabase configurado com Google OAuth

## Passo a Passo

### 1. Acessar o Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Selecione o projeto que está usando para o OAuth do Supabase (o mesmo configurado no Supabase)

### 2. Ativar a Google Classroom API

1. No menu lateral, vá em **APIs e Serviços > Biblioteca**
2. Pesquise por **Google Classroom API**
3. Clique em **Ativar**

### 3. Configurar o OAuth Consent Screen

1. Vá em **APIs e Serviços > Tela de consentimento OAuth**
2. Clique em **Editar app**
3. Na seção **Escopos**, clique em **Adicionar ou remover escopos**
4. Adicione os seguintes escopos:
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
5. Salve as alterações

> ⚠️ Se o app estiver em modo **Teste**, adicione os e-mails dos professores como usuários de teste.
> Para uso em produção, o app precisará ser verificado pelo Google (processo pode levar dias).

### 4. Verificar as Credenciais OAuth

1. Vá em **APIs e Serviços > Credenciais**
2. Clique na credencial OAuth 2.0 usada pelo Supabase
3. Em **URIs de redirecionamento autorizados**, confirme que o callback do Supabase está listado:
   ```
   https://SEU_PROJECT_ID.supabase.co/auth/v1/callback
   ```

### 5. Configurar o Supabase

No painel do Supabase:

1. Vá em **Authentication > Providers > Google**
2. Certifique-se que o **Client ID** e **Client Secret** são do mesmo projeto do Google Cloud
3. Os scopes adicionais são solicitados diretamente pelo app via `signInWithOAuth`, não precisam ser configurados no Supabase

### 6. Testar a Integração

1. Acesse o WIT Dungeon como professor
2. No painel, vá na aba **Google Classroom**
3. Clique em **Conectar Google Classroom**
4. Autorize as permissões solicitadas
5. Clique em **Carregar turmas** para ver as turmas ativas

## Observações Importantes

### Duração do Token

O `provider_token` retornado pelo Supabase tem validade de aproximadamente 1 hora. Após esse período:
- O professor precisará reconectar (clicar em "Conectar Google Classroom" novamente)
- Uma futura versão implementará refresh automático via `refresh_token`

### Erro 403 (Permission Denied)

Se aparecer erro 403 ao buscar turmas:
1. O professor deve clicar em **Reconectar com permissões**
2. Autorizar novamente com a tela de consentimento do Google
3. Certifique-se que os escopos foram adicionados corretamente no Google Cloud Console

### Modo de Teste vs Produção

- Em modo de teste: apenas usuários listados como testadores podem usar
- Em produção: o Google exige verificação do app para uso de scopes sensíveis

## Scopes Utilizados

| Scope | Descrição |
|-------|-----------|
| `classroom.courses.readonly` | Ver lista de turmas do professor |
| `classroom.rosters.readonly` | Ver lista de alunos de cada turma |

## Fluxo da Integração

```
Professor clica "Conectar"
  → supabase.auth.signInWithOAuth (scopes do Classroom)
  → Google OAuth Consent Screen
  → Redirect de volta para /professor
  → session.provider_token disponível
  → Chamadas diretas à Classroom API (browser → Google)
  → Dados importados para o Supabase
```
