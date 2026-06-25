import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import type { Student } from '@/types';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { calculateEloChange } from '@/components/pvp-arena/pvp-types';
import { PvPBattleScreen } from '@/components/pvp/PvPBattleScreen';
import type { BattleCharacter, Ability } from '@/types/character';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PvpChallenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'finished';
  challenger_score: number;
  opponent_score: number;
  winner_id: string | null;
  teacher_id: string;
  created_at: string;
}

export interface PvpOpponentInfo {
  student_id: string;
  name: string;
  character_name: string | null;
  character_class: string | null;
  level: number;
  rating: number;
}

interface BattleStats {
  forca: number;
  destreza: number;
  inteligencia: number;
  carisma: number;
  agilidade: number;
  resistencia: number;
}

interface PvpMyStats {
  rating: number;
  wins: number;
  losses: number;
  win_streak: number;
}

export interface PvpBattleData {
  matchId:       string;
  opponent:      PvpOpponentInfo & Partial<BattleStats>;
  myBattleStats: BattleStats;
  myLevel:       number;
  myStats:       PvpMyStats;
  iAmChallenger: boolean;
  /** Full character + abilities for real PvP battle (null while loading) */
  myChar?:       BattleCharacter;
  myAbilities?:  Ability[];
  oppChar?:      BattleCharacter;
  oppAbilities?: Ability[];
}

interface PvpChallengeContextValue {
  incomingChallenge: PvpChallenge | null;
  outgoingChallenge: PvpChallenge | null;
  pendingOpponent: PvpOpponentInfo | null;
  battleData: PvpBattleData | null;
  challengeTimer: number;
  /** Outgoing challenge countdown (seconds until auto-cancel). 0 when no outgoing. */
  outgoingTimer: number;
  /** While true, accept/load is in progress and a "loading" overlay can show. */
  isLoadingBattle: boolean;
  sendChallenge: (opponent: PvpOpponentInfo) => Promise<void>;
  acceptChallenge: () => Promise<void>;
  declineChallenge: () => Promise<void>;
  cancelChallenge: () => Promise<void>;
}

/**
 * Lightweight telemetry hook for PvP. Goes to:
 *   - console.info (always, with [PvP] tag)
 *   - action_log via RPC (fire-and-forget; failure is non-blocking)
 * Anything passed in `extra` gets serialized to JSONB payload.
 */
function pvpTelemetry(event: string, extra: Record<string, unknown> = {}): void {
  console.info(`[PvP] ${event}`, extra);
  void supabaseStudent.rpc('log_action', {
    p_action:       `pvp_${event}`,
    p_target_table: 'pvp_matches',
    p_target_id:    (extra.match_id as string) ?? null,
    p_target_label: (extra.label as string) ?? null,
    p_payload:      extra as never,
  }).then(() => undefined, () => undefined);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PvpChallengeContext = createContext<PvpChallengeContextValue | null>(null);

export function usePvpChallenge(): PvpChallengeContextValue {
  const ctx = useContext(PvpChallengeContext);
  if (!ctx) throw new Error('usePvpChallenge must be inside PvpChallengeProvider');
  return ctx;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchCharacterStats(studentId: string): Promise<BattleStats | null> {
  const { data: stud } = await supabaseStudent
    .from('students')
    .select('user_id, attr_forca, attr_destreza, attr_inteligencia, attr_carisma, attr_agilidade, attr_resistencia')
    .eq('id', studentId)
    .maybeSingle();
  if (!stud) return null;

  // Preferred source: the battle `characters` row (linked by user_id).
  if (stud.user_id) {
    const { data: char } = await supabaseStudent
      .from('characters')
      .select('forca, destreza, inteligencia, carisma, agilidade, resistencia')
      .eq('user_id', stud.user_id)
      .maybeSingle();
    if (char) return char as BattleStats;
  }

  // Fallback: derive battle stats from the student's academic attributes.
  // Needed so PvP still works (via the simulator) for students who never
  // opened the Hero screen and therefore have no `characters` row — without
  // this, get_pvp_opponent_data + fetchCharacterStats both return null and the
  // accept used to abort silently ("nada acontece ao aceitar o desafio").
  const s = stud as unknown as Record<string, number | null | undefined>;
  if (
    s.attr_forca == null && s.attr_destreza == null && s.attr_inteligencia == null &&
    s.attr_carisma == null && s.attr_agilidade == null && s.attr_resistencia == null
  ) {
    return null;
  }
  return {
    forca:        s.attr_forca        ?? 10,
    destreza:     s.attr_destreza     ?? 10,
    inteligencia: s.attr_inteligencia ?? 10,
    carisma:      s.attr_carisma      ?? 10,
    agilidade:    s.attr_agilidade    ?? 10,
    resistencia:  s.attr_resistencia  ?? 10,
  };
}

async function fetchOpponentInfo(studentId: string): Promise<PvpOpponentInfo> {
  const [{ data: stud }, { data: stats }] = await Promise.all([
    supabaseStudent
      .from('students')
      .select('id, name, character_name, character_class, level')
      .eq('id', studentId)
      .maybeSingle(),
    supabaseStudent
      .from('pvp_student_stats')
      .select('rating')
      .eq('student_id', studentId)
      .maybeSingle(),
  ]);
  return {
    student_id: studentId,
    name: stud?.name ?? 'Desconhecido',
    character_name: stud?.character_name ?? null,
    character_class: stud?.character_class ?? null,
    level: stud?.level ?? 1,
    rating: (stats as { rating: number } | null)?.rating ?? 1000,
  };
}

async function fetchMyStats(studentId: string): Promise<PvpMyStats> {
  const { data } = await supabaseStudent
    .from('pvp_student_stats')
    .select('rating, wins, losses, win_streak')
    .eq('student_id', studentId)
    .maybeSingle();
  return (data as PvpMyStats | null) ?? { rating: 1000, wins: 0, losses: 0, win_streak: 0 };
}

function rowToCharacter(row: any): BattleCharacter {
  return {
    id:           row.id,
    userId:       row.user_id,
    // Onda 11.3 — row.id vem de get_pvp_opponent_data(p_student_id=...) ⇒ é o student.id.
    studentId:    row.id,
    name:         row.name         ?? 'Aventureiro',
    class:        row.class        ?? 'Guerreiro',
    level:        row.level        ?? 1,
    xp:           row.xp           ?? 0,
    hpCurrent:    row.hp_max       ?? 100,  // start at full HP for PvP
    hpMax:        row.hp_max       ?? 100,
    energyMax:    row.energy_max   ?? 100,
    forca:        row.forca        ?? 10,
    inteligencia: row.inteligencia ?? 10,
    destreza:     row.destreza     ?? 10,
    carisma:      row.carisma      ?? 10,
    agilidade:    row.agilidade    ?? 10,
    resistencia:  row.resistencia  ?? 10,
    ptsFire:      row.pts_fire     ?? 0,
    ptsWater:     row.pts_water    ?? 0,
    ptsElectric:  row.pts_electric ?? 0,
    ptsGrass:     row.pts_grass    ?? 0,
    ptsIce:       row.pts_ice      ?? 0,
    ptsGround:    row.pts_ground   ?? 0,
    ptsFighting:  row.pts_fighting ?? 0,
    ptsSteel:     row.pts_steel    ?? 0,
    ptsPoison:    row.pts_poison   ?? 0,
    ptsDark:      row.pts_dark     ?? 0,
    ptsGhost:     row.pts_ghost    ?? 0,
    ptsFlying:    row.pts_flying   ?? 0,
    freePoints:   row.free_points  ?? 0,
    spriteNormal:      row.sprite_normal       ?? null,
    spritePixelFront:  row.sprite_pixel_front  ?? null,
    spritePixelBack:   row.sprite_pixel_back   ?? null,
    spritePixelAttack: row.sprite_pixel_attack ?? null,
  };
}

async function fetchFullBattleData(studentId: string): Promise<{ char: BattleCharacter; abilities: Ability[] } | null> {
  const { data, error } = await supabaseStudent.rpc('get_pvp_opponent_data' as never, {
    p_student_id: studentId,
  });
  if (error || !data) return null;

  const raw = data as any;
  if (!raw.character) return null;

  const char = rowToCharacter(raw.character);
  // get_pvp_opponent_data returns row_to_json(characters), so raw.character.id
  // is the CHARACTER id — rowToCharacter wrongly used it as studentId. The real
  // student id is the argument we just queried with. Without this, the PvP
  // engine loads class/element/passives for the wrong id (silently disabled).
  char.studentId = studentId;
  const abilities: Ability[] = (raw.abilities ?? []).map((a: any) => ({
    id:           a.id,
    name:         a.name,
    elementId:    a.elementId,
    elementName:  a.elementName,
    tier:         a.tier,
    damageType:   a.damageType,
    baseDamage:   a.baseDamage  ?? 0,
    energyCost:   a.energyCost  ?? 0,
    accuracy:     a.accuracy    ?? 100,
    requirement:  a.requirement ?? 0,
    effectType:   a.effectType,
    effectChance: a.effectChance,
    effectValue:  a.effectValue,
    description:  a.description ?? '',
    elementColor: a.elementColor,
  }));

  return { char, abilities };
}

function statsFromStudent(student: Student): BattleStats {
  return {
    forca:        student.attr_forca        ?? 10,
    destreza:     student.attr_destreza     ?? 10,
    inteligencia: student.attr_inteligencia ?? 10,
    carisma:      student.attr_carisma      ?? 10,
    agilidade:    student.attr_agilidade    ?? 10,
    resistencia:  student.attr_resistencia  ?? 10,
  };
}

// ─── Battle simulation (deterministic) ───────────────────────────────────────

function calcPower(stats: Partial<BattleStats> | null | undefined, level: number): number {
  if (!stats) return level * 60; // 10 per attr × 6 attrs × level
  return (
    (stats.forca        ?? 10) +
    (stats.destreza     ?? 10) +
    (stats.inteligencia ?? 10) +
    (stats.carisma      ?? 10) +
    (stats.agilidade    ?? 10) +
    (stats.resistencia  ?? 10)
  ) * level;
}

export function simulateBattle(
  myStats: Partial<BattleStats> | null,
  myLevel: number,
  oppStats: Partial<BattleStats> | null,
  oppLevel: number,
): { myScore: number; oppScore: number; won: boolean } {
  const myPow  = calcPower(myStats,  myLevel);
  const oppPow = calcPower(oppStats, oppLevel);
  const total  = myPow + oppPow;
  const myWins = total === 0 ? 3 : Math.max(0, Math.min(5, Math.round(5 * myPow / total)));
  return { myScore: myWins, oppScore: 5 - myWins, won: myWins >= 3 };
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@keyframes pvpctx-in  { from{opacity:0;transform:scale(.94) translateY(-10px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes pvpctx-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes pvpctx-fade { from{opacity:0} to{opacity:1} }
@keyframes pvpctx-bar  { from{width:0} to{width:100%} }

.pvpctx-in   { animation: pvpctx-in   .3s cubic-bezier(.175,.885,.32,1.275) both; }
.pvpctx-spin { animation: pvpctx-spin 1.2s linear infinite; }
.pvpctx-fade { animation: pvpctx-fade .45s ease both; }
`;

// ─── GlobalChallengeBanner ────────────────────────────────────────────────────

const CLASS_COLOR: Record<string, string> = {
  Mago: '#9b6dff', Arqueiro: '#4ade80', Curandeiro: '#38d9e8', Guerreiro: '#ff6b35',
};
const CHALLENGE_TIMEOUT = 30;          // incoming challenge auto-decline (sec)
const OUTGOING_TIMEOUT  = 60;          // outgoing challenge auto-cancel  (sec)
const BATTLE_LOAD_TIMEOUT_MS = 12_000; // fetch battle data within this or bail

function GlobalChallengeBanner({
  opponent,
  timer,
  onAccept,
  onDecline,
}: {
  opponent: PvpOpponentInfo;
  timer: number;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name  = (opponent.character_name ?? opponent.name).toUpperCase();
  const color = CLASS_COLOR[opponent.character_class ?? ''] ?? '#38d9e8';
  const pct   = Math.max(0, (timer / CHALLENGE_TIMEOUT) * 100);

  return (
    <>
      <style>{CSS}</style>
      <div className="pvpctx-in" style={{
        position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'rgba(4,6,10,0.97)',
        border: '1px solid rgba(56,217,232,.4)',
        borderRadius: 14,
        padding: '18px 24px',
        minWidth: 300, maxWidth: 360,
        boxShadow: '0 0 40px rgba(56,217,232,.1), 0 16px 48px rgba(0,0,0,.85)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Timer bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          borderRadius: '14px 14px 0 0',
          background: 'rgba(56,217,232,.12)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: timer > 10 ? '#38d9e8' : '#f87171',
            transition: 'width 1s linear, background .5s ease',
            borderRadius: 'inherit',
          }} />
        </div>

        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9, color: 'rgba(56,217,232,.55)', letterSpacing: '3px',
          marginBottom: 10, textAlign: 'center',
        }}>
          DESAFIO RECEBIDO — {timer}s
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: `${color}12`,
            border: `1.5px solid ${color}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color,
          }}>
            {name.slice(0, 2)}
          </div>
          <div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700,
              color: '#c8d8f0', letterSpacing: '1px',
            }}>
              {name}
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
              color: 'rgba(120,150,190,.45)', marginTop: 3,
            }}>
              {opponent.character_class ? `${opponent.character_class.toUpperCase()} · ` : ''}NV {opponent.level} · {opponent.rating} ELO
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onAccept} style={{
            flex: 1, padding: '9px 0', borderRadius: 8,
            border: '1px solid rgba(74,222,128,.4)',
            background: 'rgba(74,222,128,.08)', color: '#4ade80',
            fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: '1.5px',
            cursor: 'pointer', transition: 'all .2s',
          }}>ACEITAR</button>
          <button onClick={onDecline} style={{
            flex: 1, padding: '9px 0', borderRadius: 8,
            border: '1px solid rgba(248,113,113,.3)',
            background: 'rgba(248,113,113,.05)', color: '#f87171',
            fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: '1.5px',
            cursor: 'pointer', transition: 'all .2s',
          }}>RECUSAR</button>
        </div>
      </div>
    </>
  );
}

// ─── PvpBattleOverlay ─────────────────────────────────────────────────────────

function PvpBattleOverlay({
  student,
  battleData,
  onFinish,
}: {
  student: Student;
  battleData: PvpBattleData;
  onFinish: (won: boolean, myScore: number, oppScore: number) => Promise<void>;
}) {
  const { opponent, myBattleStats, myLevel, myStats } = battleData;

  const result   = simulateBattle(myBattleStats, myLevel, opponent, opponent.level);
  const eloChange = calculateEloChange(myStats.rating, opponent.rating, result.won);

  const [phase, setPhase] = useState<'intro' | 'countdown' | 'combat' | 'result'>('intro');
  const [count, setCount]   = useState(3);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPhase('countdown'), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count > 0) {
      const t = setTimeout(() => setCount(c => c - 1), 850);
      return () => clearTimeout(t);
    }
    setPhase('combat');
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'combat') return;
    const t = setTimeout(() => setPhase('result'), 2400);
    return () => clearTimeout(t);
  }, [phase]);

  const myName  = (student.character_name ?? student.name).toUpperCase();
  const oppName = (opponent.character_name ?? opponent.name).toUpperCase();
  const oppColor = CLASS_COLOR[opponent.character_class ?? ''] ?? '#9b6dff';

  async function handleContinue() {
    if (finishing) return;
    setFinishing(true);
    await onFinish(result.won, result.myScore, result.oppScore);
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'linear-gradient(160deg, #04060a 0%, #060c18 55%, #04060a 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(56,217,232,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(56,217,232,.018) 1px,transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '-8%', width: 400, height: 320, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(56,217,232,.05),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '-8%', width: 400, height: 320, borderRadius: '50%', background: 'radial-gradient(ellipse,rgba(155,109,255,.05),transparent 70%)', pointerEvents: 'none' }} />

        {/* INTRO */}
        {phase === 'intro' && (
          <div className="pvpctx-fade" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10, color: 'rgba(56,217,232,.5)', letterSpacing: '4px', marginBottom: 28,
            }}>
              PVP ARENA
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
              {/* Me */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%', margin: '0 auto 10px',
                  background: 'rgba(56,217,232,.08)', border: '2px solid rgba(56,217,232,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 700, color: '#38d9e8',
                }}>
                  {myName.slice(0, 2)}
                </div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: '#c8d8f0' }}>
                  {myName}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(120,150,190,.4)', marginTop: 3 }}>
                  NV {myLevel} · {myStats.rating} ELO
                </div>
              </div>

              <div style={{
                fontFamily: "'Orbitron', sans-serif", fontSize: 30, fontWeight: 900,
                color: '#38d9e8', letterSpacing: '4px',
                textShadow: '0 0 30px rgba(56,217,232,.4)',
              }}>VS</div>

              {/* Opponent */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%', margin: '0 auto 10px',
                  background: `${oppColor}12`, border: `2px solid ${oppColor}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 700, color: oppColor,
                }}>
                  {oppName.slice(0, 2)}
                </div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: '#c8d8f0' }}>
                  {oppName}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: 'rgba(120,150,190,.4)', marginTop: 3 }}>
                  NV {opponent.level} · {opponent.rating} ELO
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COUNTDOWN */}
        {phase === 'countdown' && (
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10, color: 'rgba(56,217,232,.45)', letterSpacing: '3px', marginBottom: 20,
            }}>
              BATALHA INICIANDO
            </div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: count > 0 ? 104 : 56,
              fontWeight: 900,
              color: count > 0 ? '#38d9e8' : '#4ade80',
              textShadow: `0 0 50px ${count > 0 ? 'rgba(56,217,232,.55)' : 'rgba(74,222,128,.55)'}`,
              transition: 'all .25s',
              letterSpacing: count > 0 ? '0' : '10px',
              lineHeight: 1,
            }}>
              {count > 0 ? count : 'LUTA!'}
            </div>
          </div>
        )}

        {/* COMBAT */}
        {phase === 'combat' && (
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div className="pvpctx-spin" style={{
              width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
              border: '3px solid transparent',
              borderTopColor: '#38d9e8',
              borderRightColor: oppColor,
            }} />
            <div style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: 12,
              color: 'rgba(200,216,240,.5)', letterSpacing: '3px',
            }}>
              COMBATENDO...
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <div className="pvpctx-fade" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 38, fontWeight: 900,
              color: result.won ? '#4ade80' : '#f87171',
              letterSpacing: '6px',
              textShadow: `0 0 45px ${result.won ? 'rgba(74,222,128,.55)' : 'rgba(248,113,113,.55)'}`,
              marginBottom: 18,
            }}>
              {result.won ? 'VITORIA!' : 'DERROTA'}
            </div>

            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 34, color: '#c8d8f0', letterSpacing: '6px', marginBottom: 14,
            }}>
              {result.myScore}
              <span style={{ color: 'rgba(120,150,190,.3)', fontSize: 22, margin: '0 8px' }}>—</span>
              {result.oppScore}
            </div>

            <div style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: 15,
              color: eloChange >= 0 ? '#4ade80' : '#f87171', marginBottom: 8,
            }}>
              {eloChange >= 0 ? '+' : ''}{eloChange} ELO
            </div>

            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: 12,
              color: 'rgba(120,150,190,.4)', marginBottom: 28,
            }}>
              vs {oppName}
            </div>

            <button
              onClick={handleContinue}
              disabled={finishing}
              style={{
                padding: '11px 40px', borderRadius: 8,
                border: '1px solid rgba(56,217,232,.35)',
                background: finishing ? 'rgba(56,217,232,.03)' : 'rgba(56,217,232,.08)',
                color: '#38d9e8',
                fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: '2px',
                cursor: finishing ? 'not-allowed' : 'pointer',
                opacity: finishing ? 0.5 : 1,
                transition: 'all .2s',
              }}
            >
              {finishing ? 'SALVANDO...' : 'CONTINUAR'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface PvpChallengeProviderProps {
  student: Student;
  isInBattle?: boolean;
  children: React.ReactNode;
}

export function PvpChallengeProvider({
  student,
  isInBattle = false,
  children,
}: PvpChallengeProviderProps) {
  const [incomingChallenge, setIncomingChallenge] = useState<PvpChallenge | null>(null);
  const [outgoingChallenge, setOutgoingChallenge] = useState<PvpChallenge | null>(null);
  const [pendingOpponent,   setPendingOpponent]   = useState<PvpOpponentInfo | null>(null);
  const [battleData,        setBattleData]        = useState<PvpBattleData | null>(null);
  const [challengeTimer,    setChallengeTimer]    = useState(CHALLENGE_TIMEOUT);
  const [outgoingTimer,     setOutgoingTimer]     = useState(0);
  const [isLoadingBattle,   setIsLoadingBattle]   = useState(false);

  // Refs so realtime callbacks always have fresh values without recreating the channel
  const outgoingRef     = useRef<PvpChallenge | null>(null);
  const pendingOppRef   = useRef<PvpOpponentInfo | null>(null);
  const isInBattleRef   = useRef(isInBattle);
  const battleDataRef   = useRef<PvpBattleData | null>(null);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const outgoingTimerRef= useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDeclinedRef = useRef<string | null>(null);
  const autoCanceledRef = useRef<string | null>(null);
  const incomingRef     = useRef<PvpChallenge | null>(null);
  // Guards the challenger-side "opponent accepted → load battle" transition so
  // realtime and the polling fallback can't both fire it for the same match.
  const acceptInFlightRef = useRef<string | null>(null);
  // Guards match resolution so onFinish + the in-battle poll can't double-resolve.
  const resolvedRef     = useRef<string | null>(null);
  // In-flight guard: prevents concurrent resolveMatch calls for the same match.
  // Separate from resolvedRef so a failed write doesn't permanently disable the poll.
  const resolvingRef    = useRef<string | null>(null);
  // Wall-clock when the current battle screen opened (catch-all deadlock timeout).
  const battleOpenedAtRef = useRef<number>(0);
  // Mirror so the poll can pause while battle data is loading (avoids racing the
  // accept/begin transition and clearing the opponent name mid-load).
  const isLoadingBattleRef = useRef(false);

  useEffect(() => { outgoingRef.current   = outgoingChallenge; }, [outgoingChallenge]);
  useEffect(() => { pendingOppRef.current = pendingOpponent;   }, [pendingOpponent]);
  useEffect(() => { isInBattleRef.current = isInBattle;        }, [isInBattle]);
  useEffect(() => { battleDataRef.current = battleData;        }, [battleData]);
  useEffect(() => { incomingRef.current   = incomingChallenge; }, [incomingChallenge]);
  useEffect(() => { isLoadingBattleRef.current = isLoadingBattle; }, [isLoadingBattle]);
  useEffect(() => {
    // Stamp when a battle opens; reset the resolution guard for the new match.
    if (battleData) { battleOpenedAtRef.current = Date.now(); resolvedRef.current = null; }
  }, [battleData?.matchId]);

  // ── Timer management ──────────────────────────────────────────────────────

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setChallengeTimer(CHALLENGE_TIMEOUT);
  }

  useEffect(() => {
    if (!incomingChallenge) { stopTimer(); return; }

    setChallengeTimer(CHALLENGE_TIMEOUT);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setChallengeTimer(t => Math.max(0, t - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [incomingChallenge?.id]);

  // Auto-decline at zero
  useEffect(() => {
    if (challengeTimer !== 0 || !incomingChallenge) return;
    if (autoDeclinedRef.current === incomingChallenge.id) return;
    autoDeclinedRef.current = incomingChallenge.id;
    stopTimer();
    pvpTelemetry('challenge_auto_declined', { match_id: incomingChallenge.id });
    supabaseStudent
      .from('pvp_matches')
      .update({ status: 'declined' })
      .eq('id', incomingChallenge.id)
      .then(() => { setIncomingChallenge(null); setPendingOpponent(null); });
  }, [challengeTimer, incomingChallenge?.id]);

  // ── Outgoing challenge timer (auto-cancel if opponent doesn't respond) ────

  function stopOutgoingTimer() {
    if (outgoingTimerRef.current) {
      clearInterval(outgoingTimerRef.current);
      outgoingTimerRef.current = null;
    }
    setOutgoingTimer(0);
  }

  useEffect(() => {
    if (!outgoingChallenge) { stopOutgoingTimer(); return; }
    setOutgoingTimer(OUTGOING_TIMEOUT);
    if (outgoingTimerRef.current) clearInterval(outgoingTimerRef.current);
    outgoingTimerRef.current = setInterval(() => setOutgoingTimer(t => Math.max(0, t - 1)), 1000);
    return () => { if (outgoingTimerRef.current) clearInterval(outgoingTimerRef.current); };
  }, [outgoingChallenge?.id]);

  // Auto-cancel outgoing at zero
  useEffect(() => {
    if (outgoingTimer !== 0 || !outgoingChallenge) return;
    if (autoCanceledRef.current === outgoingChallenge.id) return;
    autoCanceledRef.current = outgoingChallenge.id;
    stopOutgoingTimer();
    pvpTelemetry('challenge_auto_canceled', { match_id: outgoingChallenge.id });
    supabaseStudent
      .from('pvp_matches')
      .update({ status: 'declined' })
      .eq('id', outgoingChallenge.id)
      .then(() => { setOutgoingChallenge(null); setPendingOpponent(null); });
  }, [outgoingTimer, outgoingChallenge?.id]);

  // ── Battle data loader (single source of truth) ───────────────────────────
  //
  // Why this exists
  //   Historic bug: acceptChallenge and the challenger-side realtime listener
  //   each fetched all the battle data independently and set battleData even
  //   when the RPC returned null. The fallback PvpBattleOverlay then ran a
  //   deterministic "simulator" that finished in 4s and wrote an ELO loss —
  //   that's the "ao desafio ser aceito, o desafiante perde instantaneamente"
  //   symptom users hit. We now require BOTH characters to load (with a hard
  //   12s timeout) or we bail cleanly, canceling the match without any ELO
  //   side-effects.
  async function loadBattleData(
    matchId: string,
    opponentStudentId: string,
    opp: PvpOpponentInfo,
    iAmChallenger: boolean,
  ): Promise<PvpBattleData | null> {
    setIsLoadingBattle(true);
    try {
      const timeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('BATTLE_LOAD_TIMEOUT')), BATTLE_LOAD_TIMEOUT_MS)
      );
      const work = Promise.all([
        fetchCharacterStats(student.id),
        fetchCharacterStats(opponentStudentId),
        fetchMyStats(student.id),
        fetchFullBattleData(student.id),
        fetchFullBattleData(opponentStudentId),
      ]);
      const [myChar, oppChar, myStats, myFull, oppFull] = await Promise.race([work, timeout]) as Awaited<typeof work>;

      // When BOTH full character bundles are present we run the interactive
      // PvPBattleScreen. When either is missing (e.g. a player who never opened
      // the Hero screen has no `characters` row, so get_pvp_opponent_data returns
      // null) we no longer abort the accept — we fall back to the attribute-based
      // PvpBattleOverlay simulator by leaving myChar/oppChar undefined. Battle
      // stats for the simulator come from fetchCharacterStats (which itself now
      // falls back to the student's academic attributes), so the result is fair
      // for both sides instead of the old "instant unfair loss".
      const haveFullBundles = !!myFull?.char && !!oppFull?.char;
      if (!haveFullBundles) {
        pvpTelemetry('battle_data_fallback_simulator', {
          match_id: matchId,
          has_my_full: !!myFull?.char,
          has_opp_full: !!oppFull?.char,
          i_am_challenger: iAmChallenger,
        });
      }

      return {
        matchId,
        opponent: { ...opp, ...(oppChar ?? {}) },
        myBattleStats: myChar ?? statsFromStudent(student),
        myLevel:       student.level,
        myStats,
        iAmChallenger,
        myChar:        myFull?.char,
        myAbilities:   myFull?.abilities,
        oppChar:       oppFull?.char,
        oppAbilities:  oppFull?.abilities,
      };
    } catch (err) {
      pvpTelemetry('battle_data_error', {
        match_id: matchId,
        error: err instanceof Error ? err.message : String(err),
        i_am_challenger: iAmChallenger,
      });
      return null;
    } finally {
      setIsLoadingBattle(false);
    }
  }

  // Cancel a match cleanly without touching ELO. Used when battle data fails
  // to load so neither side gets penalized.
  async function abortMatch(matchId: string, reason: string) {
    pvpTelemetry('match_aborted', { match_id: matchId, reason });
    await supabaseStudent
      .from('pvp_matches')
      .update({ status: 'declined' })
      .eq('id', matchId);
  }

  // Show an incoming challenge banner. Shared by realtime + the polling
  // fallback. Idempotent: ignores duplicates and anything not still pending.
  async function showIncomingChallenge(match: PvpChallenge, source: string) {
    if (match.status !== 'pending' || isInBattleRef.current) return;
    if (incomingRef.current?.id === match.id) return;          // already showing it
    if (outgoingRef.current || battleDataRef.current) return;  // busy elsewhere
    if (autoDeclinedRef.current === match.id) return;          // already gave up on it
    const info = await fetchOpponentInfo(match.challenger_id);
    setIncomingChallenge(match);
    setPendingOpponent(info);
    pvpTelemetry('incoming_challenge_shown', { match_id: match.id, source });
  }

  // Challenger side: the opponent accepted → load both characters and enter
  // battle. Shared by realtime + the polling fallback, guarded so only ONE
  // path runs it per match (prevents double battle / double ELO).
  async function beginBattleAsChallenger(match: PvpChallenge, source: string) {
    if (acceptInFlightRef.current === match.id) return;        // already transitioning
    if (battleDataRef.current?.matchId === match.id) return;   // already in this battle
    if (outgoingRef.current?.id !== match.id) return;          // not my live outgoing
    acceptInFlightRef.current = match.id;                      // claim it (synchronous)
    pvpTelemetry('challenger_received_accept', { match_id: match.id, source });
    setOutgoingChallenge(null);
    stopOutgoingTimer();
    try {
      const opp = pendingOppRef.current ?? await fetchOpponentInfo(match.opponent_id);
      const data = await loadBattleData(match.id, match.opponent_id, opp, true);
      if (!data) {
        await abortMatch(match.id, 'challenger_data_load_failed');
        setPendingOpponent(null);
        return;
      }
      pvpTelemetry('battle_started', { match_id: match.id, side: 'challenger' });
      setBattleData(data);
    } finally {
      acceptInFlightRef.current = null;
    }
  }

  // ── Realtime channel (permanent for the session) ──────────────────────────
  //
  // Reconnect strategy
  //   We treat the channel as a permanent subscription for the lifetime of
  //   the provider. On CHANNEL_ERROR / CLOSED, Supabase's JS client will
  //   auto-retry, but we also re-subscribe explicitly to be defensive
  //   against half-open WebSocket states (Wi-Fi flip, sleep, etc.). The
  //   subscribe callback logs each state transition for diagnosability.

  useEffect(() => {
    const channel = supabaseStudent
      .channel(`pvp_global_${student.id}`)
      // Someone challenged ME or updated a match I'm in
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'pvp_matches',
        filter: `opponent_id=eq.${student.id}`,
      }, async (payload) => {
        const match = payload.new as PvpChallenge;

        // Handle new challenge (INSERT)
        if (payload.eventType === 'INSERT') {
          await showIncomingChallenge(match, 'realtime');
          return;
        }

        // Handle match updates (UPDATE) - like the challenger finishing the match
        if (payload.eventType === 'UPDATE') {
          if (match.status === 'finished') {
            if (incomingRef.current?.id === match.id) { setIncomingChallenge(null); setPendingOpponent(null); }
            const bd = battleDataRef.current;
            // Route through resolveMatch so ELO is always scored, even when the
            // opponent's terminal write arrives here first (the old path just did
            // setBattleData(null) which skipped ELO entirely for the loser side).
            if (bd?.matchId === match.id) void resolveMatch(bd, match.winner_id === student.id);
          } else if (match.status === 'declined') {
            if (incomingRef.current?.id === match.id) { setIncomingChallenge(null); setPendingOpponent(null); }
            if (battleDataRef.current?.matchId === match.id) {
              resolvedRef.current = match.id; setBattleData(null); setPendingOpponent(null);
            }
          }
        }
      })
      // My challenge got a response or the opponent finished
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pvp_matches',
        filter: `challenger_id=eq.${student.id}`,
      }, async (payload) => {
        const match = payload.new as PvpChallenge;
        const currentOutgoing = outgoingRef.current;

        // Match I initiated got updated
        if (match.status === 'accepted') {
          await beginBattleAsChallenger(match, 'realtime');
        } else if (match.status === 'finished') {
          const bd = battleDataRef.current;
          if (bd?.matchId === match.id) {
            pvpTelemetry('match_closed_remote', { match_id: match.id, status: 'finished' });
            void resolveMatch(bd, match.winner_id === student.id);
          } else if (currentOutgoing?.id === match.id) {
            setOutgoingChallenge(null); setPendingOpponent(null);
          }
        } else if (match.status === 'declined') {
          pvpTelemetry('match_closed_remote', { match_id: match.id, status: 'declined' });
          setOutgoingChallenge(null); setBattleData(null); setPendingOpponent(null);
        }
      })
      .subscribe((status) => {
        // Surface channel state for diagnosability and let Supabase's auto-retry
        // do its job. Manual re-subscribe would race with the SDK's internal
        // retry; we just log here.
        if (status === 'SUBSCRIBED') {
          pvpTelemetry('realtime_subscribed', {});
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          pvpTelemetry('realtime_disconnected', { status });
        }
      });

    return () => { channel.unsubscribe(); };
  }, [student.id]);

  // ── Polling fallback (realtime is unreliable in classrooms) ────────────────
  //
  // Telemetry showed ~99% of challenges auto-cancelled: the opponent's realtime
  // channel kept dropping (CHANNEL_ERROR/CLOSED), so the INSERT event that pops
  // the incoming-challenge banner never arrived and the 60s timeout fired. We
  // reconcile state from the DB every few seconds so PvP no longer depends on
  // realtime being healthy. All transitions go through the same guarded helpers
  // the realtime handlers use, so the two paths can't double-fire.
  useEffect(() => {
    const POLL_MS = 4000;
    let stopped = false;

    async function tick() {
      if (stopped) return;

      // In-battle deadlock backstop: while a battle is live, in-battle moves are
      // exchanged over realtime broadcast (no replay). If a move is dropped or
      // the two engines disagree on the winner, one side can hang forever. We
      // reconcile the terminal state from the DB: whoever finished first wrote
      // the winner; the other side ends here. Also exits if the match was
      // aborted/declined, or after a hard timeout as a last resort.
      const bd = battleDataRef.current;
      if (bd) {
        if (resolvedRef.current === bd.matchId) return;
        try {
          const { data } = await supabaseStudent
            .from('pvp_matches')
            .select('status, winner_id')
            .eq('id', bd.matchId)
            .maybeSingle();
          const row = data as { status: string; winner_id: string | null } | null;
          if (row?.status === 'finished') {
            await resolveMatch(bd, row.winner_id === student.id);
          } else if (row?.status === 'declined' || row?.status === 'cancelled') {
            resolvedRef.current = bd.matchId;       // exit cleanly, no ELO
            setBattleData(null);
            setPendingOpponent(null);
          } else if (Date.now() - battleOpenedAtRef.current > 180_000) {
            // 3-min catch-all: a battle should never run this long. Abort with
            // no ELO so neither side is stranded if every realtime path failed.
            pvpTelemetry('battle_timeout_abort', { match_id: bd.matchId });
            await abortMatch(bd.matchId, 'battle_timeout');
            resolvedRef.current = bd.matchId;
            setBattleData(null);
            setPendingOpponent(null);
          }
        } catch { /* transient — next tick retries */ }
        return;
      }

      if (isInBattleRef.current || isLoadingBattleRef.current) return;
      try {
        // A) Outgoing: did the opponent accept / decline my challenge?
        const out = outgoingRef.current;
        if (out) {
          const { data } = await supabaseStudent
            .from('pvp_matches')
            .select('*')
            .eq('id', out.id)
            .maybeSingle();
          const m = data as PvpChallenge | null;
          if (m?.status === 'accepted') {
            await beginBattleAsChallenger(m, 'poll');
          } else if (m?.status === 'declined' || m?.status === 'finished') {
            setOutgoingChallenge(null);
            setPendingOpponent(null);
          }
          return; // while I have an outgoing challenge, don't also pull incoming
        }

        // B) Incoming: a pending challenge where I'm the opponent.
        if (!incomingRef.current) {
          const { data } = await supabaseStudent
            .from('pvp_matches')
            .select('*')
            .eq('opponent_id', student.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (data) await showIncomingChallenge(data as PvpChallenge, 'poll');
        } else {
          // I'm showing a banner — make sure it's still pending (opponent may
          // have cancelled). If it's gone, clear so the banner doesn't linger.
          const { data } = await supabaseStudent
            .from('pvp_matches')
            .select('id, status')
            .eq('id', incomingRef.current.id)
            .maybeSingle();
          if (data && data.status !== 'pending') {
            setIncomingChallenge(null);
            setPendingOpponent(null);
          }
        }
      } catch { /* transient — next tick retries */ }
    }

    const id = setInterval(tick, POLL_MS);
    return () => { stopped = true; clearInterval(id); };
  }, [student.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendChallenge = useCallback(async (opponent: PvpOpponentInfo) => {
    if (outgoingRef.current) return;
    setPendingOpponent(opponent);
    const { data, error } = await supabaseStudent
      .from('pvp_matches')
      .insert({
        teacher_id:    student.teacher_id,
        challenger_id: student.id,
        opponent_id:   opponent.student_id,
        status:        'pending',
      })
      .select()
      .single();
    if (!error && data) {
      pvpTelemetry('challenge_sent', { match_id: (data as PvpChallenge).id, opponent_id: opponent.student_id });
      setOutgoingChallenge(data as PvpChallenge);
    } else {
      pvpTelemetry('challenge_send_failed', { error: error?.message });
      setPendingOpponent(null);
    }
  }, [student]);

  const acceptChallenge = useCallback(async () => {
    if (!incomingChallenge) return;
    stopTimer();
    pvpTelemetry('challenge_accepted', { match_id: incomingChallenge.id });

    await supabaseStudent
      .from('pvp_matches')
      .update({ status: 'accepted' })
      .eq('id', incomingChallenge.id);

    const challenger = pendingOppRef.current ?? await fetchOpponentInfo(incomingChallenge.challenger_id);
    const data = await loadBattleData(incomingChallenge.id, incomingChallenge.challenger_id, challenger, false);

    if (!data) {
      // Battle data failed — cancel cleanly so the challenger's listener also
      // drops back without recording a "phantom" loss against either side.
      await abortMatch(incomingChallenge.id, 'opponent_data_load_failed');
      setIncomingChallenge(null);
      setPendingOpponent(null);
      return;
    }

    setIncomingChallenge(null);
    pvpTelemetry('battle_started', { match_id: incomingChallenge.id, side: 'opponent' });
    setBattleData(data);
  }, [incomingChallenge, student]); // eslint-disable-line react-hooks/exhaustive-deps

  const declineChallenge = useCallback(async () => {
    if (!incomingChallenge) return;
    stopTimer();
    await supabaseStudent
      .from('pvp_matches')
      .update({ status: 'declined' })
      .eq('id', incomingChallenge.id);
    setIncomingChallenge(null);
    setPendingOpponent(null);
  }, [incomingChallenge]);

  const cancelChallenge = useCallback(async () => {
    const current = outgoingRef.current;
    if (!current) return;
    await supabaseStudent
      .from('pvp_matches')
      .update({ status: 'declined' })
      .eq('id', current.id);
    setOutgoingChallenge(null);
    setPendingOpponent(null);
  }, []);

  // ── Battle finish (DB-authoritative, idempotent) ──────────────────────────
  //
  // Why this is DB-first instead of trusting the local engine:
  //   The two clients run independent BattleEngine instances and recompute
  //   damage with their own Math.random(), so their HP/winner can diverge, and
  //   a dropped realtime move can leave one side hanging forever. We make the
  //   pvp_matches row the single source of truth: whoever reaches a terminal
  //   state first writes the winner (first-writer-wins, guarded by
  //   `status <> finished`), BOTH sides then read back the authoritative winner
  //   and score ELO from it. The in-battle poll calls this too, so even if a
  //   broadcast is lost the loser still gets resolved from the DB within ~4s.
  async function resolveMatch(bd: PvpBattleData, localWon: boolean) {
    if (resolvedRef.current === bd.matchId) return;    // already resolved
    if (resolvingRef.current === bd.matchId) return;   // in-flight — don't double-fire
    resolvingRef.current = bd.matchId;

    const { matchId, opponent, iAmChallenger } = bd;
    const myId  = student.id;
    const oppId = opponent.student_id;
    const myScore  = localWon ? 3 : 2;
    const oppScore = localWon ? 2 : 3;

    try {
      // First-writer-wins terminal write. `.neq('status','finished')` means the
      // second finisher is a no-op, so the winner is whoever got there first.
      await supabaseStudent.from('pvp_matches').update({
        status:           'finished',
        winner_id:        localWon ? myId : oppId,
        challenger_score: iAmChallenger ? myScore : oppScore,
        opponent_score:   iAmChallenger ? oppScore : myScore,
        finished_at:      new Date().toISOString(),
      }).eq('id', matchId).neq('status', 'finished');

      // Read back the authoritative winner (the other side may have written first).
      // If this read fails we bail WITHOUT latching resolvedRef so the poll retries.
      const { data: fresh, error: readError } = await supabaseStudent
        .from('pvp_matches').select('winner_id').eq('id', matchId).maybeSingle();
      if (readError || !fresh) {
        pvpTelemetry('battle_resolve_read_failed', { match_id: matchId, error: readError?.message });
        return; // resolvedRef stays null → poll retries in ~4s
      }

      // Latch AFTER confirmed read so a failed write/read doesn't permanently
      // disable the poll backstop (the critical bug from the second review).
      resolvedRef.current = matchId;

      const authWinner = fresh.winner_id ?? (localWon ? myId : oppId);
      const authWon    = authWinner === myId;

      // Fetch fresh stats to avoid stale ELO snapshot captured at battle start.
      const freshStats = await fetchMyStats(myId);
      const eloChange  = calculateEloChange(freshStats.rating, opponent.rating, authWon);
      const newRating  = Math.max(0, freshStats.rating + eloChange);
      await supabaseStudent.from('pvp_student_stats').upsert({
        student_id: myId,
        rating:     newRating,
        wins:       freshStats.wins   + (authWon ? 1 : 0),
        losses:     freshStats.losses + (authWon ? 0 : 1),
        win_streak: authWon ? freshStats.win_streak + 1 : 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' });

      if (authWon) {
        void supabaseStudent.rpc('increment_daily_counter', { p_type: 'pvp_wins', p_amount: 1 });
      }
      pvpTelemetry('battle_resolved', { match_id: matchId, won: authWon });
    } catch (err) {
      pvpTelemetry('battle_resolve_error', { match_id: matchId, error: err instanceof Error ? err.message : String(err) });
      // Don't latch resolvedRef on error — poll will retry on next tick.
      return;
    } finally {
      resolvingRef.current = null;
      // Clear battle UI only when we confirmed the result (resolvedRef latched).
      if (resolvedRef.current === matchId) {
        setBattleData(null);
        setPendingOpponent(null);
      }
    }
  }

  // Local engine reached a terminal state (victory/defeat/surrender/flee).
  function handleFinishBattle(won: boolean) {
    const bd = battleDataRef.current;
    if (!bd) return;
    void resolveMatch(bd, won);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PvpChallengeContext.Provider value={{
      incomingChallenge,
      outgoingChallenge,
      pendingOpponent,
      battleData,
      challengeTimer,
      outgoingTimer,
      isLoadingBattle,
      sendChallenge,
      acceptChallenge,
      declineChallenge,
      cancelChallenge,
    }}>
      {children}

      {incomingChallenge && pendingOpponent && !battleData && !isLoadingBattle && (
        <GlobalChallengeBanner
          opponent={pendingOpponent}
          timer={challengeTimer}
          onAccept={acceptChallenge}
          onDecline={declineChallenge}
        />
      )}

      {/* Loading overlay while battle data is fetched. If the fetch fully fails
          or times out, loadBattleData returns null and the accept aborts. If
          only the full character bundles are missing, loadBattleData still
          returns battle data and the PvpBattleOverlay simulator below runs —
          now fair for both sides (stats fall back to academic attributes), so
          the old "desafiante perde instantaneamente" unfairness is avoided. */}
      {isLoadingBattle && !battleData && (
        <BattleLoadingOverlay opponent={pendingOpponent} />
      )}

      {battleData && battleData.myChar && battleData.oppChar && (
        <PvPBattleScreen
          matchId={battleData.matchId}
          myChar={battleData.myChar}
          myAbilities={battleData.myAbilities ?? []}
          oppChar={battleData.oppChar}
          oppAbilities={battleData.oppAbilities ?? []}
          iAmChallenger={battleData.iAmChallenger}
          onFinish={(won) => handleFinishBattle(won)}
        />
      )}

      {/* Simulator fallback: full character data was unavailable for one of the
          players (no `characters` row). Resolve the match via the attribute-based
          PvpBattleOverlay so the accept doesn't dead-end. Winner is still written
          DB-authoritatively by resolveMatch (handleFinishBattle). */}
      {battleData && (!battleData.myChar || !battleData.oppChar) && (
        <PvpBattleOverlay
          student={student}
          battleData={battleData}
          onFinish={async (won) => handleFinishBattle(won)}
        />
      )}
    </PvpChallengeContext.Provider>
  );
}

// ─── Battle loading overlay ───────────────────────────────────────────────────
// Shown while the engine is gathering both characters' data. Hard-cancels via
// the load timeout (12s) instead of falling back to the old simulator.
function BattleLoadingOverlay({ opponent }: { opponent: PvpOpponentInfo | null }) {
  return (
    <>
      <style>{CSS}</style>
      <div className="pvpctx-fade" style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'linear-gradient(160deg, #04060a 0%, #060c18 55%, #04060a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 18,
      }}>
        <div className="pvpctx-spin" style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#38d9e8',
          borderRightColor: '#9b6dff',
        }} />
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10, letterSpacing: '3px',
          color: 'rgba(56,217,232,.55)',
          textAlign: 'center',
        }}>
          PREPARANDO BATALHA
        </div>
        {opponent && (
          <div style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 13, color: 'rgba(200,216,240,.6)', letterSpacing: '1px',
            textAlign: 'center', marginTop: 4,
          }}>
            vs {(opponent.character_name ?? opponent.name).toUpperCase()}
          </div>
        )}
      </div>
    </>
  );
}
