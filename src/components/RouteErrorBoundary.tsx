import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Último anteparo entre um erro de render e a tela branca.
 *
 * O projeto não tinha nenhum error boundary. Sem um, qualquer exceção durante
 * o render — inclusive a rejeição de um `import()` de rota lazy — desmonta a
 * árvore inteira e deixa o `#root` vazio. O aluno vê preto, sem mensagem, sem
 * botão, sem saber que basta recarregar.
 *
 * O caso que motivou isto: um `@import` de fonte dentro de um CSS que entrava
 * num chunk lazy. Se o Google Fonts não respondesse — numa escola que bloqueie
 * o domínio, por exemplo — o Vite tratava como falha do chunk, o `import()`
 * rejeitava e o portal inteiro sumia. Aquele `@import` saiu, mas a causa geral
 * continua possível: chunk que não baixa em Wi-Fi ruim é exatamente o mesmo
 * fim.
 *
 * Falha de carregamento de chunk ganha tratamento próprio porque tem conserto
 * de verdade: quase sempre é rede instável ou um deploy que trocou os arquivos
 * debaixo de uma aba aberta, e recarregar resolve os dois.
 */

interface Props {
  children: ReactNode;
}

interface State {
  erro: Error | null;
}

/** Erro de chunk que não baixou, nas várias formas que os navegadores usam. */
function ehFalhaDeChunk(erro: Error): boolean {
  const texto = `${erro.name} ${erro.message}`;
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS|Importing a module script failed/i
    .test(texto);
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // Vai para o console do navegador — é o que o professor consegue printar
    // e mandar quando um aluno reclama.
    console.error("[RouteErrorBoundary]", erro, info.componentStack);
  }

  private recarregar = () => {
    window.location.reload();
  };

  private voltarAoInicio = () => {
    window.location.href = "/";
  };

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    const deChunk = ehFalhaDeChunk(erro);

    return (
      <div
        role="alert"
        style={{
          position: "fixed", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 18, padding: 24, textAlign: "center",
          background: "linear-gradient(180deg, #0a0e14 0%, #050810 100%)",
          color: "rgba(255,255,255,0.88)",
          fontFamily: "'Rajdhani', 'Inter', sans-serif",
        }}
      >
        <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden>
          {deChunk ? "📡" : "⚠️"}
        </div>

        <h1 style={{
          margin: 0, fontFamily: "'Orbitron', sans-serif",
          fontSize: 20, letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          {deChunk ? "Conexão instável" : "Algo quebrou por aqui"}
        </h1>

        <p style={{ margin: 0, maxWidth: 440, fontSize: 15, opacity: 0.75 }}>
          {deChunk
            ? "Parte do jogo não terminou de baixar. Isso costuma ser a internet da escola — recarregar resolve."
            : "A tela encontrou um erro e parou. Recarregar costuma resolver; seu progresso está salvo no servidor."}
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={this.recarregar}
            style={{
              padding: "10px 22px", borderRadius: 6, cursor: "pointer",
              border: "1px solid rgba(0,217,255,0.45)",
              background: "rgba(0,217,255,0.12)",
              color: "#7fe8ff", fontFamily: "inherit",
              fontSize: 14, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Recarregar
          </button>
          <button
            onClick={this.voltarAoInicio}
            style={{
              padding: "10px 22px", borderRadius: 6, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent",
              color: "rgba(255,255,255,0.65)", fontFamily: "inherit",
              fontSize: 14, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Ir para o início
          </button>
        </div>

        {/* A mensagem crua fica disponível sem poluir a tela — é o que o
            professor precisa copiar para reportar. */}
        <details style={{ marginTop: 6, fontSize: 12, opacity: 0.4, maxWidth: 520 }}>
          <summary style={{ cursor: "pointer" }}>Detalhes técnicos</summary>
          <pre style={{
            marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-word",
            textAlign: "left", fontSize: 11,
          }}>
            {erro.name}: {erro.message}
          </pre>
        </details>
      </div>
    );
  }
}
