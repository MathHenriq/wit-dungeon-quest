import { useState } from "react";
import { X, Edit3 } from "lucide-react";
import { CharacterCustomization } from "@/components/CharacterCustomization";
import { GameIcon } from "@/components/icons/GameIcon";
import { CATEGORY_META, ATTRIBUTES } from "@/types";
import type { Student, InventoryItem } from "@/types";
import { PetPanel } from "@/components/student/PetPanel";
import { MentorshipPanel } from "@/components/student/MentorshipPanel";

// ─── Attribute colors ─────────────────────────────────────────────────────────

const ATTR_COLORS: Record<string, string> = {
  attr_forca: "#ff6b35",
  attr_destreza: "#4caf50",
  attr_inteligencia: "#b388ff",
  attr_carisma: "#00e5ff",
  attr_agilidade: "#ffd700",
  attr_resistencia: "#f44336",
};

const MAX_ATTR = 25;

// ─── CharacterSilhouette ──────────────────────────────────────────────────────

function CharacterSilhouette({ characterClass }: { characterClass: string | null }) {
  const color =
    characterClass === "Mago"
      ? "#b388ff"
      : characterClass === "Arqueiro"
      ? "#4caf50"
      : characterClass === "Curandeiro"
      ? "#00e5ff"
      : "#ff6b35";

  return (
    <svg
      width="120"
      height="180"
      viewBox="0 0 60 90"
      style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
    >
      {/* Head */}
      <ellipse cx="30" cy="12" rx="9" ry="10" fill={color} opacity="0.85" />
      {/* Body */}
      <path d="M18 28 Q30 22 42 28 L40 60 Q30 64 20 60 Z" fill={color} opacity="0.75" />
      {/* Left arm */}
      <path d="M18 28 L10 50 Q9 54 12 55 L18 45 Z" fill={color} opacity="0.7" />
      {/* Right arm */}
      <path d="M42 28 L50 50 Q51 54 48 55 L42 45 Z" fill={color} opacity="0.7" />
      {/* Left leg */}
      <path d="M20 60 L17 85 Q20 87 23 85 L25 62 Z" fill={color} opacity="0.75" />
      {/* Right leg */}
      <path d="M40 60 L43 85 Q40 87 37 85 L35 62 Z" fill={color} opacity="0.75" />
    </svg>
  );
}

// ─── EquipSlot ────────────────────────────────────────────────────────────────

function EquipSlot({ item, label }: { item: InventoryItem | undefined; label: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const shopItem = item?.item;
  const meta = shopItem ? CATEGORY_META[shopItem.category] : null;

  return (
    <div className="relative">
      <button
        className="w-full flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
        style={{
          background: shopItem ? "rgba(255,215,0,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${shopItem ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.08)"}`,
          minHeight: "60px",
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={label}
      >
        {shopItem ? (
          shopItem.image_url ? (
            <img
              src={shopItem.image_url}
              alt={shopItem.name}
              className="w-8 h-8 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <GameIcon id={meta?.iconId ?? "sword"} size={28} />
          )
        ) : (
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ border: "1px dashed rgba(255,255,255,0.12)" }}
          >
            <span className="text-white/20 text-xs">—</span>
          </div>
        )}
        <span className="text-white/30 text-xs">{label}</span>
      </button>

      {showTooltip && shopItem && (
        <div
          className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 rounded-lg p-2 text-xs text-white/80"
          style={{ background: "rgba(10,14,26,0.95)", border: "1px solid rgba(0,229,255,0.2)" }}
        >
          <p className="font-bold text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            {shopItem.name}
          </p>
          {shopItem.description && <p className="text-white/50">{shopItem.description}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface CharacterSheetProps {
  student: Student;
  inventory: InventoryItem[];
  onUpdate: () => void;
}

export function CharacterSheet({ student, inventory, onUpdate }: CharacterSheetProps) {
  const [showEdit, setShowEdit] = useState(false);

  // XP
  const xp = (student as Record<string, unknown>).xp as number ?? 0;
  const xpToNext = student.level * 100;
  const xpPct = Math.min((xp / xpToNext) * 100, 100);

  // Equipment slots
  const weaponItem = inventory.find((i) => i.item?.category === "armamento");
  const armorItem = inventory.find((i) => i.item?.category === "armadura");
  const accessoryItem = inventory.find((i) => i.item?.category === "utilizavel");
  const collectItem = inventory.find((i) => i.item?.category === "colecao");
  const skillItem = inventory.find((i) => i.item?.category === "habilidade");
  const tokenItem = inventory.find((i) => i.item?.category === "token");

  return (
    <div className="space-y-4 pb-8">
      {/* ── Identity panel ── */}
      <div className="holo-panel">
        <div className="flex items-center gap-4">
          <div className="level-badge w-14 h-14 text-2xl flex-shrink-0">{student.level}</div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold text-white truncate"
              style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "2px" }}
            >
              {student.character_name ?? student.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-white/50 mt-0.5">
              {student.character_class && <span>{student.character_class}</span>}
              {student.character_class && student.race && (
                <span className="text-white/20">•</span>
              )}
              {student.race && <span>{student.race}</span>}
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>XP</span>
            <span>
              {xp} / {xpToNext}
            </span>
          </div>
          <div className="cyber-progress">
            <div className="cyber-progress-bar" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Equipment panel ── */}
      <div className="holo-panel">
        <div
          className="text-xs font-bold mb-4 uppercase tracking-wider text-white/50 flex items-center gap-2"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-sm"
            style={{ background: "#00e5ff", transform: "rotate(45deg)" }}
          />
          Equipamento
        </div>

        <div className="grid grid-cols-7 gap-2 items-center">
          {/* Left slots */}
          <div className="col-span-2 flex flex-col gap-2">
            <EquipSlot item={armorItem} label="Armadura" />
            <EquipSlot item={skillItem} label="Habilidade" />
            <EquipSlot item={tokenItem} label="Token" />
          </div>

          {/* Silhouette */}
          <div className="col-span-3 flex justify-center">
            <CharacterSilhouette characterClass={student.character_class} />
          </div>

          {/* Right slots */}
          <div className="col-span-2 flex flex-col gap-2">
            <EquipSlot item={weaponItem} label="Arma" />
            <EquipSlot item={accessoryItem} label="Acessório" />
            <EquipSlot item={collectItem} label="Coleção" />
          </div>
        </div>
      </div>

      {/* ── Attributes panel ── */}
      <div className="holo-panel">
        <div
          className="text-xs font-bold mb-4 uppercase tracking-wider text-white/50 flex items-center gap-2"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-sm"
            style={{ background: "#00e5ff", transform: "rotate(45deg)" }}
          />
          Atributos
        </div>

        <div className="space-y-3">
          {ATTRIBUTES.map((attr) => {
            const val = (student[attr.key as keyof Student] as number) ?? 0;
            const pct = Math.min((val / MAX_ATTR) * 100, 100);
            const color = ATTR_COLORS[attr.key] ?? "#00e5ff";
            return (
              <div key={attr.key} className="flex items-center gap-3">
                <div className="w-5 flex-shrink-0">
                  <GameIcon id={attr.iconId} size={18} />
                </div>
                <span
                  className="w-24 text-xs text-white/60 flex-shrink-0"
                  style={{ fontFamily: "Rajdhani, sans-serif" }}
                >
                  {attr.label}
                </span>
                <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: color,
                      boxShadow: `0 0 6px ${color}66`,
                    }}
                  />
                </div>
                <span className="w-6 text-xs text-right flex-shrink-0" style={{ color }}>
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Inventory panel ── */}
      {inventory.length > 0 && (
        <div className="holo-panel">
          <div
            className="text-xs font-bold mb-4 uppercase tracking-wider text-white/50 flex items-center gap-2"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-sm"
              style={{ background: "#00e5ff", transform: "rotate(45deg)" }}
            />
            Inventário ({inventory.length})
          </div>

          <div className="grid grid-cols-6 gap-2">
            {inventory.map((entry) => {
              const item = entry.item;
              if (!item) return null;
              const meta = CATEGORY_META[item.category];
              return (
                <div
                  key={entry.id}
                  className="aspect-square rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  title={item.name}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <GameIcon id={meta?.iconId ?? "sword"} size={24} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── História panel ── */}
      {(student.motivation || student.lore) && (
        <div className="holo-panel">
          <div
            className="text-xs font-bold mb-4 uppercase tracking-wider text-white/50 flex items-center gap-2"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-sm"
              style={{ background: "#00e5ff", transform: "rotate(45deg)" }}
            />
            História
          </div>

          {student.motivation && (
            <div className="mb-3">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Motivação</p>
              <p className="text-white/70 text-sm">{student.motivation}</p>
            </div>
          )}
          {student.lore && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Lore</p>
              <p className="text-white/70 text-sm italic">{student.lore}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Pet panel ── */}
      <PetPanel studentId={student.id} teacherId={student.teacher_id} />

      {/* ── Mentorship panel ── */}
      <MentorshipPanel student={student} />

      {/* ── Edit button ── */}
      <button
        onClick={() => setShowEdit(true)}
        className="btn-cyber w-full justify-center"
      >
        <Edit3 size={16} />
        Editar Personagem
      </button>

      {/* ── Edit modal ── */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowEdit(false)}
          />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-2xl rounded-xl"
            style={{
              background: "rgba(10,14,26,0.97)",
              border: "1px solid rgba(0,229,255,0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Sticky header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{
                background: "rgba(10,14,26,0.97)",
                borderBottom: "1px solid rgba(0,229,255,0.08)",
              }}
            >
              <h2
                className="font-bold text-white text-lg"
                style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "3px" }}
              >
                EDITAR PERSONAGEM
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="p-2 rounded-lg text-white/40 hover:text-white/80 transition-colors"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <CharacterCustomization
                student={student}
                onUpdate={() => {
                  onUpdate();
                  setShowEdit(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
