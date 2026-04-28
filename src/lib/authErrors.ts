// Maps Supabase Auth error codes/messages to friendly Portuguese messages
// shown to students. Keep wording short — most of these end up in toast titles.

type SupabaseAuthError = { code?: string; message?: string; status?: number } | null | undefined;

export function describeSignUpError(err: SupabaseAuthError): string {
  if (!err) return "Não foi possível criar a conta. Tente novamente.";
  const code = err.code ?? "";
  if (code === "user_already_exists" || code === "email_exists") {
    return "Este email já tem conta. Use 'Entrar' com a senha que você criou antes.";
  }
  if (code === "weak_password") {
    return "Senha muito curta. Use pelo menos 6 caracteres.";
  }
  if (code === "validation_failed" || code === "email_address_invalid") {
    return "Email inválido. Verifique se digitou certo (ex: nome@gmail.com).";
  }
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || err.status === 429) {
    return "Muitas tentativas em pouco tempo. Aguarde 1 minuto e tente de novo.";
  }
  if (code === "signup_disabled") {
    return "Cadastro temporariamente desativado. Avise seu professor.";
  }
  return err.message || "Erro ao criar conta.";
}

export function describeLoginError(err: SupabaseAuthError): string {
  if (!err) return "Não foi possível entrar. Tente novamente.";
  const code = err.code ?? "";
  if (code === "invalid_credentials") {
    return "Email ou senha incorretos.";
  }
  if (code === "email_not_confirmed") {
    return "Email ainda não confirmado. Cheque sua caixa de entrada.";
  }
  if (code === "over_request_rate_limit" || err.status === 429) {
    return "Muitas tentativas em pouco tempo. Aguarde 1 minuto e tente de novo.";
  }
  if (code === "user_banned") {
    return "Conta bloqueada. Fale com seu professor.";
  }
  return err.message || "Erro ao entrar.";
}

// Lightweight client-side validation: only catch the obviously empty / malformed
// cases. Supabase is the source of truth — some test accounts use shapes like
// "aluno@aluno" that aren't real-world emails but are valid for our purposes.
export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "Digite seu email.";
  if (v.includes(" ")) return "O email não pode ter espaços.";
  const at = v.indexOf("@");
  if (at < 1 || at === v.length - 1) return "Email inválido. Precisa ter algo antes e depois do @.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Digite uma senha.";
  if (password.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  return null;
}
