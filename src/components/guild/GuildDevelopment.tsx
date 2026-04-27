import React, { useEffect, useState } from 'react';
import { supabaseStudent } from '@/integrations/supabase/studentClient';

interface GuildStats {
  score:            number;
  total_member_xp:  number;
  avg_member_level: number;
  total_pvp_wins:   number;
  member_count:     number;
  xp:               number;
  level:            number;
}

interface GuildDevelopmentProps {
  guildId: string;
}

interface FactorBarProps {
  label:       string;
  sublabel:    string;
  value:       string;
  contribution:number; // points this factor contributes to total score
  color:       string;
  icon:        string;
}

function FactorBar({ label, sublabel, value, contribution, color, icon }: FactorBarProps) {
  return (
    <div className="gdev-factor">
      <div className="gdev-factor__header">
        <span className="gdev-factor__icon">{icon}</span>
        <div className="gdev-factor__labels">
          <span className="gdev-factor__label">{label}</span>
          <span className="gdev-factor__sublabel">{sublabel}</span>
        </div>
        <div className="gdev-factor__right">
          <span className="gdev-factor__value">{value}</span>
          <span className="gdev-factor__contrib" style={{ color }}>
            +{contribution.toLocaleString('pt-BR')} pts
          </span>
        </div>
      </div>
      <div className="gdev-factor__bar-track">
        <div
          className="gdev-factor__bar-fill"
          style={{ background: color, width: '100%', opacity: 0.7 }}
        />
      </div>
    </div>
  );
}

export function GuildDevelopment({ guildId }: GuildDevelopmentProps) {
  const [stats, setStats]       = useState<GuildStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!guildId) return;
    setIsLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabaseStudent as any)
      .from('guild_ranking_global')
      .select('score, total_member_xp, avg_member_level, total_pvp_wins, member_count, xp, level')
      .eq('id', guildId)
      .maybeSingle()
      .then(({ data }: { data: GuildStats | null }) => {
        setStats(data);
        setIsLoading(false);
      });
  }, [guildId]);

  if (isLoading) {
    return (
      <div className="guild-development guild-animate">
        <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.4, fontSize: 13 }}>
          Carregando...
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const xpContrib    = Math.floor((stats.total_member_xp  ?? 0) * 0.4);
  const lvlContrib   = Math.floor((stats.avg_member_level ?? 1) * 500 * 0.3);
  const pvpContrib   = Math.floor((stats.total_pvp_wins   ?? 0) * 50 * 0.2);
  const membContrib  = Math.floor((stats.member_count     ?? 0) * 200 * 0.1);
  const total        = xpContrib + lvlContrib + pvpContrib + membContrib;

  const factors = [
    {
      label:        'XP Total dos Membros',
      sublabel:     'Peso 40% — soma do XP de todos os integrantes',
      value:        (stats.total_member_xp ?? 0).toLocaleString('pt-BR') + ' XP',
      contribution: xpContrib,
      color:        '#825ADB',
      icon:         '⚡',
    },
    {
      label:        'Nível Médio da Guilda',
      sublabel:     'Peso 30% — média de nível × 500',
      value:        `Nv. ${Number(stats.avg_member_level ?? 1).toFixed(1)}`,
      contribution: lvlContrib,
      color:        '#5AADB8',
      icon:         '📈',
    },
    {
      label:        'Vitórias PvP',
      sublabel:     'Peso 20% — soma de vitórias PvP × 50',
      value:        `${stats.total_pvp_wins ?? 0} vitórias`,
      contribution: pvpContrib,
      color:        '#DB5A5A',
      icon:         '⚔️',
    },
    {
      label:        'Número de Membros',
      sublabel:     'Peso 10% — membros × 200',
      value:        `${stats.member_count ?? 0} membros`,
      contribution: membContrib,
      color:        '#5ADB8B',
      icon:         '👥',
    },
  ];

  return (
    <div className="guild-development guild-animate">
      <div className="guild-section-hdr">Desenvolvimento da Guilda</div>

      {/* Score card */}
      <div className="gdev-score-card">
        <div className="gdev-score-card__label">Score Total</div>
        <div className="gdev-score-card__value">
          {total.toLocaleString('pt-BR')}
        </div>
        <div className="gdev-score-card__sub">pontos de classificação</div>
        <div className="gdev-score-card__divider" />
        <div className="gdev-score-card__meta-row">
          <div className="gdev-score-card__meta-item">
            <span className="gdev-score-card__meta-val">Nv. {stats.level}</span>
            <span className="gdev-score-card__meta-lbl">Nível Guilda</span>
          </div>
          <div className="gdev-score-card__meta-item">
            <span className="gdev-score-card__meta-val">{(stats.xp ?? 0).toLocaleString('pt-BR')}</span>
            <span className="gdev-score-card__meta-lbl">XP Guilda</span>
          </div>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="gdev-factors-title">Composição do Score</div>
      <div className="gdev-factors">
        {factors.map(f => (
          <FactorBar key={f.label} {...f} />
        ))}
      </div>

      {/* Score breakdown bar (visual stacked) */}
      <div className="gdev-stack-label">Distribuição dos pontos</div>
      <div className="gdev-stack-bar">
        {factors.map(f => {
          const pct = total > 0 ? (f.contribution / total) * 100 : 25;
          return (
            <div
              key={f.label}
              className="gdev-stack-bar__segment"
              style={{ width: `${pct}%`, background: f.color }}
              title={`${f.label}: ${f.contribution.toLocaleString('pt-BR')} pts`}
            />
          );
        })}
      </div>
      <div className="gdev-stack-legend">
        {factors.map(f => (
          <div key={f.label} className="gdev-stack-legend__item">
            <span className="gdev-stack-legend__dot" style={{ background: f.color }} />
            <span className="gdev-stack-legend__text">{f.icon} {f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
