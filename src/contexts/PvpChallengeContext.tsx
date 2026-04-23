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
  sendChallenge: (opponent: PvpOpponentInfo) => Promise<void>;
  acceptChallenge: () => Promise<void>;
  declineChallenge: () => Promise<void>;
  cancelChallenge: () => Promise<void>;
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
    .select('user_id')
    .eq('id', studentId)
    .maybeSingle();
  if (!stud?.user_id) return null;

  const { data: char } = await supabaseStudent
    .from('characters')
    .select('forca, destreza, inteligencia, carisma, agilidade, resistencia')
    .eq('user_id', stud.user_id)
    .maybeSingle();

  return (char as BattleStats | null);
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
const CHALLENGE_TIMEOUT = 30;

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

  // Refs so realtime callbacks always have fresh values without recreating the channel
  const outgoingRef     = useRef<PvpChallenge | null>(null);
  const pendingOppRef   = useRef<PvpOpponentInfo | null>(null);
  const isInBattleRef   = useRef(isInBattle);
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDeclinedRef = useRef<string | null>(null);

  useEffect(() => { outgoingRef.current   = outgoingChallenge; }, [outgoingChallenge]);
  useEffect(() => { pendingOppRef.current = pendingOpponent;   }, [pendingOpponent]);
  useEffect(() => { isInBattleRef.current = isInBattle;        }, [isInBattle]);

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
    supabaseStudent
      .from('pvp_matches')
      .update({ status: 'declined' })
      .eq('id', incomingChallenge.id)
      .then(() => { setIncomingChallenge(null); setPendingOpponent(null); });
  }, [challengeTimer, incomingChallenge?.id]);

  // ── Realtime channel (permanent for the session) ──────────────────────────

  useEffect(() => {
    const channel = supabaseStudent
      .channel(`pvp_global_${student.id}`)
      // Someone challenged ME
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'pvp_matches',
        filter: `opponent_id=eq.${student.id}`,
      }, async (payload) => {
        const match = payload.new as PvpChallenge;
        if (match.status !== 'pending' || isInBattleRef.current) return;
        const info = await fetchOpponentInfo(match.challenger_id);
        setIncomingChallenge(match);
        setPendingOpponent(info);
      })
      // My challenge got a response
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'pvp_matches',
        filter: `challenger_id=eq.${student.id}`,
      }, async (payload) => {
        const match = payload.new as PvpChallenge;
        const current = outgoingRef.current;
        if (!current || current.id !== match.id) return;

        if (match.status === 'accepted') {
          setOutgoingChallenge(null);
          const opp = pendingOppRef.current ?? await fetchOpponentInfo(match.opponent_id);
          const [myChar, oppChar, myStats, myFull, oppFull] = await Promise.all([
            fetchCharacterStats(student.id),
            fetchCharacterStats(match.opponent_id),
            fetchMyStats(student.id),
            fetchFullBattleData(student.id),
            fetchFullBattleData(match.opponent_id),
          ]);
          setBattleData({
            matchId: match.id,
            opponent: { ...opp, ...(oppChar ?? {}) },
            myBattleStats: myChar ?? statsFromStudent(student),
            myLevel: student.level,
            myStats,
            iAmChallenger: true,
            myChar:       myFull?.char,
            myAbilities:  myFull?.abilities,
            oppChar:      oppFull?.char,
            oppAbilities: oppFull?.abilities,
          });
        } else if (match.status === 'declined') {
          setOutgoingChallenge(null);
          setPendingOpponent(null);
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [student.id]);

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
      setOutgoingChallenge(data as PvpChallenge);
    } else {
      setPendingOpponent(null);
    }
  }, [student]);

  const acceptChallenge = useCallback(async () => {
    if (!incomingChallenge) return;
    stopTimer();

    await supabaseStudent
      .from('pvp_matches')
      .update({ status: 'accepted' })
      .eq('id', incomingChallenge.id);

    const challenger = pendingOppRef.current ?? await fetchOpponentInfo(incomingChallenge.challenger_id);
    const [myChar, oppChar, myStats, myFull, oppFull] = await Promise.all([
      fetchCharacterStats(student.id),
      fetchCharacterStats(incomingChallenge.challenger_id),
      fetchMyStats(student.id),
      fetchFullBattleData(student.id),
      fetchFullBattleData(incomingChallenge.challenger_id),
    ]);

    setIncomingChallenge(null);
    setBattleData({
      matchId:       incomingChallenge.id,
      opponent:      { ...challenger, ...(oppChar ?? {}) },
      myBattleStats: myChar ?? statsFromStudent(student),
      myLevel:       student.level,
      myStats,
      iAmChallenger: false,
      myChar:        myFull?.char,
      myAbilities:   myFull?.abilities,
      oppChar:       oppFull?.char,
      oppAbilities:  oppFull?.abilities,
    });
  }, [incomingChallenge, student]);

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

  // ── Battle finish ─────────────────────────────────────────────────────────

  async function handleFinishBattle(won: boolean, myScore: number, oppScore: number) {
    if (!battleData) return;
    const { matchId, opponent, myStats, iAmChallenger } = battleData;

    // Only challenger writes the match result (no race condition)
    if (iAmChallenger) {
      await supabaseStudent.from('pvp_matches').update({
        status:           'finished',
        winner_id:        won ? student.id : opponent.student_id,
        challenger_score: myScore,
        opponent_score:   oppScore,
        finished_at:      new Date().toISOString(),
      }).eq('id', matchId);
    }

    // Both sides update their own ELO independently
    const eloChange = calculateEloChange(myStats.rating, opponent.rating, won);
    const newRating  = Math.max(0, myStats.rating + eloChange);
    await supabaseStudent.from('pvp_student_stats').upsert({
      student_id: student.id,
      rating:     newRating,
      wins:       myStats.wins    + (won ? 1 : 0),
      losses:     myStats.losses  + (won ? 0 : 1),
      win_streak: won ? myStats.win_streak + 1 : 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' });

    setBattleData(null);
    setPendingOpponent(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PvpChallengeContext.Provider value={{
      incomingChallenge,
      outgoingChallenge,
      pendingOpponent,
      battleData,
      challengeTimer,
      sendChallenge,
      acceptChallenge,
      declineChallenge,
      cancelChallenge,
    }}>
      {children}

      {incomingChallenge && pendingOpponent && !battleData && (
        <GlobalChallengeBanner
          opponent={pendingOpponent}
          timer={challengeTimer}
          onAccept={acceptChallenge}
          onDecline={declineChallenge}
        />
      )}

      {battleData && battleData.myChar && battleData.oppChar && (
        <PvPBattleScreen
          matchId={battleData.matchId}
          myChar={battleData.myChar}
          myAbilities={battleData.myAbilities ?? []}
          oppChar={battleData.oppChar}
          oppAbilities={battleData.oppAbilities ?? []}
          iAmChallenger={battleData.iAmChallenger}
          onFinish={(won) => handleFinishBattle(
            won,
            won ? 3 : 2,
            won ? 2 : 3,
          )}
        />
      )}

      {/* Fallback: character data not loaded yet — keep old overlay to avoid blank screen */}
      {battleData && (!battleData.myChar || !battleData.oppChar) && (
        <PvpBattleOverlay
          student={student}
          battleData={battleData}
          onFinish={handleFinishBattle}
        />
      )}
    </PvpChallengeContext.Provider>
  );
}
