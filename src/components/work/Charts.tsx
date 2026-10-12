// Gráficos simples em SVG (linha e barras) para os trabalhos que ensinam a
// ler dados: o Mercado (preço por dia) e o Diário do Lago (peixes por hora).
// Cores e traços em código; nada de imagem.

const INK = '#2e2a40', GRID = '#e4dccb', SUB = '#8a8498';

/** Linha com pontos; `onPick` deixa tocar num ponto. `extra` = um ponto tracejado depois do último (amanhã). */
export function LineChart({ series, labels, color = '#c8762a', width = 300, height = 150, onPick, mark, wrong, extra, mean: showMean, range, unit = '' }: {
  series: number[]; labels: string[]; color?: string; width?: number; height?: number;
  onPick?: (i: number) => void; mark?: number | null; wrong?: number | null; extra?: { label: string; value: number } | null; mean?: number | null;
  /** Eixo fixo (para comparar gráficos na mesma escala). */ range?: [number, number]; unit?: string;
}) {
  const all = [...series, ...(extra ? [extra.value] : []), ...(showMean ? [showMean] : [])];
  const lo = range ? range[0] : Math.max(0, Math.floor(Math.min(...all) * 0.85)), hi = range ? range[1] : Math.ceil(Math.max(...all) * 1.08);
  const n = series.length + (extra ? 1 : 0);
  const L = 30, R = extra ? 30 : 12, T = 10, B = 22, w = width - L - R, h = height - T - B;
  const x = (i: number) => L + (n === 1 ? w / 2 : (i * w) / (n - 1));
  const y = (v: number) => T + h - ((v - lo) / Math.max(1, hi - lo)) * h;
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const path = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" style={{ maxWidth: width * 1.6 }}>
      {ticks.map(t => <g key={t}><line x1={L} x2={width - R} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} /><text x={L - 4} y={y(t) + 3} fontSize={8} textAnchor="end" fill={SUB}>{t}{unit}</text></g>)}
      {showMean != null && <g><line x1={L} x2={width - R} y1={y(showMean)} y2={y(showMean)} stroke="#3a78c8" strokeDasharray="4 3" /><text x={L + 3} y={y(showMean) - 3} fontSize={7} textAnchor="start" fill="#3a78c8">média {showMean.toFixed(1)}</text></g>}
      <path d={path} fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
      {extra && <line x1={x(series.length - 1)} y1={y(series[series.length - 1])} x2={x(series.length)} y2={y(extra.value)} stroke={color} strokeWidth={2} strokeDasharray="4 3" />}
      {series.map((v, i) => (
        <g key={i} onClick={onPick ? () => onPick(i) : undefined} style={{ cursor: onPick ? 'pointer' : undefined }}>
          {onPick && <rect x={x(i) - w / n / 2} y={T} width={w / n} height={h} fill="transparent" />}
          <circle cx={x(i)} cy={y(v)} r={mark === i || wrong === i ? 6 : 3.5} fill={mark === i ? '#3a9a5a' : wrong === i ? '#e8485a' : '#fff'} stroke={mark === i ? '#1e6a3a' : wrong === i ? '#a02838' : color} strokeWidth={2} />
          {(mark === i || wrong === i) && <text x={x(i)} y={y(v) - 9} fontSize={9} textAnchor="middle" fill={INK} fontWeight={700}>{v}</text>}
          <text x={x(i)} y={height - 6} fontSize={7.5} textAnchor="middle" fill={i === series.length - 1 ? INK : SUB} fontWeight={i === series.length - 1 ? 700 : 400}>{labels[i]}</text>
        </g>
      ))}
      {extra && <g><circle cx={x(series.length)} cy={y(extra.value)} r={4.5} fill="#ffd84a" stroke={INK} strokeWidth={1.5} /><text x={x(series.length)} y={y(extra.value) - 8} fontSize={9} textAnchor="middle" fill={INK} fontWeight={700}>{extra.value}</text><text x={x(series.length)} y={height - 6} fontSize={7.5} textAnchor="middle" fill={INK}>{extra.label}</text></g>}
    </svg>
  );
}

/** Barras verticais com rótulo embaixo e valor em cima. */
export function BarChart({ values, labels, colors, width = 300, height = 140, highlight, inner, innerColor = '#a84ae8' }: {
  values: number[]; labels: string[]; colors?: string[]; width?: number; height?: number; highlight?: number | null;
  /** Uma parte de cada barra (ex.: os raros dentro do total), desenhada por dentro, de baixo para cima. */ inner?: number[]; innerColor?: string;
}) {
  const L = 8, R = 8, T = 14, B = 22, w = width - L - R, h = height - T - B;
  const hi = Math.max(1, ...values), bw = w / values.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" style={{ maxWidth: width * 1.6 }}>
      <line x1={L} x2={width - R} y1={T + h} y2={T + h} stroke={GRID} />
      {values.map((v, i) => {
        const bh = (v / hi) * h, c = colors?.[i] ?? '#3a78c8';
        return (
          <g key={i}>
            <rect x={L + i * bw + bw * 0.15} y={T + h - bh} width={bw * 0.7} height={bh} rx={2} fill={c} stroke={highlight === i ? INK : 'none'} strokeWidth={2} />
            {inner && inner[i] > 0 && <g>
              <rect x={L + i * bw + bw * 0.3} y={T + h - (inner[i] / hi) * h} width={bw * 0.4} height={(inner[i] / hi) * h} rx={2} fill={innerColor} stroke="#fff" strokeWidth={1} />
              <text x={L + i * bw + bw / 2} y={T + h - 3} fontSize={8} textAnchor="middle" fill="#fff" fontWeight={700}>{inner[i]}</text>
            </g>}
            <text x={L + i * bw + bw / 2} y={T + h - bh - 3} fontSize={9} textAnchor="middle" fill={INK} fontWeight={700}>{v}</text>
            <text x={L + i * bw + bw / 2} y={height - 7} fontSize={7.5} textAnchor="middle" fill={SUB}>{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
