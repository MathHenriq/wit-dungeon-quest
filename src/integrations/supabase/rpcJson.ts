/**
 * Conversão de retorno JSON de RPC para o tipo que o chamador espera.
 *
 * As RPCs que devolvem `jsonb` chegam ao cliente tipadas como `Json`, uma
 * união recursiva de primitivos, arrays e objetos. Converter direto para uma
 * interface (`data as ForgeState`) faz o TypeScript reclamar que os tipos não
 * se sobrepõem o suficiente — e a saída fácil era espalhar `as any`, que
 * desliga a verificação de tudo em volta.
 *
 * Esta função concentra a conversão num único ponto, documentado: aqui o
 * formato vem do contrato da função SQL, não do tipo gerado. Se a RPC mudar,
 * o tipo passado aqui é o que precisa ser atualizado junto.
 *
 * Não valida nada em runtime — é uma asserção de tipo, igual ao cast que
 * substitui. A diferença é que fica explícito *por que* o cast existe, e que
 * o escopo é só o retorno da RPC.
 */
export function rpcJson<T>(data: unknown): T {
  return data as T;
}
