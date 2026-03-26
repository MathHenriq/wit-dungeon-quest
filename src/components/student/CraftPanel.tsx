import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, X } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { GameIcon } from "@/components/icons/GameIcon";
import { toast } from "sonner";
import type { CraftRecipe, SkillNode, SkillProgress, StudentCraft } from "@/types";

const RARITY_META: Record<string, { label: string; color: string; glow: string }> = {
  common:    { label: "Comum",    color: "rgba(156,163,175,0.15)", glow: "#9ca3af" },
  uncommon:  { label: "Incomum",  color: "rgba(74,222,128,0.12)",  glow: "#4ade80" },
  rare:      { label: "Rara",     color: "rgba(0,229,255,0.12)",   glow: "#00e5ff" },
  epic:      { label: "Épica",    color: "rgba(168,85,247,0.15)",  glow: "#a855f7" },
  legendary: { label: "Lendária", color: "rgba(255,215,0,0.15)",   glow: "#ffd700" },
};

function CraftFlash({ rarity }: { rarity: string }) {
  const glow = RARITY_META[rarity]?.glow ?? "#00e5ff";
  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none animate-fade-in-up"
      style={{
        background: `radial-gradient(ellipse at center, ${glow}30 0%, transparent 70%)`,
        animation: "craft-flash 1s ease-out forwards",
      }}
    />
  );
}

interface CraftPanelProps {
  studentId: string;
  teacherId: string;
  onCoinsChanged?: () => void;
}

export function CraftPanel({ studentId, teacherId, onCoinsChanged }: CraftPanelProps) {
  const [recipes, setRecipes] = useState<CraftRecipe[]>([]);
  const [allNodes, setAllNodes] = useState<SkillNode[]>([]);
  const [progress, setProgress] = useState<SkillProgress[]>([]);
  const [crafted, setCrafted] = useState<StudentCraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [craftingId, setCraftingId] = useState<string | null>(null);
  const [flashRarity, setFlashRarity] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [{ data: recipesData }, { data: progressData }, { data: craftedData }] = await Promise.all([
      supabaseStudent.from("craft_recipes").select("*").eq("teacher_id", teacherId).order("rarity"),
      supabaseStudent.from("student_skill_progress").select("*").eq("student_id", studentId),
      supabaseStudent.from("student_crafts").select("*").eq("student_id", studentId),
    ]);

    const fetchedRecipes = (recipesData ?? []) as CraftRecipe[];
    setRecipes(fetchedRecipes);
    setProgress((progressData ?? []) as SkillProgress[]);
    setCrafted((craftedData ?? []) as StudentCraft[]);

    // Load all nodes that appear in recipes
    const allNodeIds = new Set<string>();
    for (const r of fetchedRecipes) {
      if (Array.isArray(r.ingredient_nodes)) {
        for (const id of r.ingredient_nodes) allNodeIds.add(id);
      }
    }

    if (allNodeIds.size > 0) {
      const { data: nodesData } = await supabaseStudent
        .from("skill_nodes")
        .select("*")
        .in("id", Array.from(allNodeIds));
      setAllNodes((nodesData ?? []) as SkillNode[]);
    }

    setIsLoading(false);
  }, [studentId, teacherId]);

  useEffect(() => { load(); }, [load]);

  const completedNodeIds = new Set(progress.filter((p) => p.completed).map((p) => p.node_id));
  const craftedRecipeIds = new Set(crafted.map((c) => c.recipe_id));

  function canCraft(recipe: CraftRecipe) {
    const ingredients = Array.isArray(recipe.ingredient_nodes) ? recipe.ingredient_nodes : [];
    return ingredients.every((id) => completedNodeIds.has(id));
  }

  async function doCraft(recipe: CraftRecipe) {
    setCraftingId(recipe.id);

    // Optimistic: mark recipe as crafted instantly so the button disappears
    const tempCraft: StudentCraft = {
      id: `opt-${Date.now()}`,
      student_id: studentId,
      recipe_id: recipe.id,
      crafted_at: new Date().toISOString(),
    };
    setCrafted(prev => [...prev, tempCraft]);

    try {
      const { data, error } = await supabaseStudent.rpc("craft_item" as never, {
        p_student_id: studentId,
        p_recipe_id: recipe.id,
      });

      if (error) {
        setCrafted(prev => prev.filter(c => c.id !== tempCraft.id));
        toast.error("Erro ao craftar: " + error.message);
        return;
      }

      const result = data as { success: boolean; error?: string; reward_coins?: number; reward_xp?: number };
      if (!result.success) {
        setCrafted(prev => prev.filter(c => c.id !== tempCraft.id));
        toast.error(result.error ?? "Não foi possível craftar este item.");
        return;
      }

      setFlashRarity(recipe.rarity);
      setTimeout(() => setFlashRarity(null), 1100);

      const parts = [];
      if (result.reward_coins && result.reward_coins > 0) parts.push(`+${result.reward_coins} moedas`);
      if (result.reward_xp && result.reward_xp > 0) parts.push(`+${result.reward_xp} XP`);
      toast.success(`${recipe.name} criado!${parts.length ? " " + parts.join(", ") : ""}`, { duration: 4000 });

      onCoinsChanged?.();
      // Sync real DB row in background (replaces temp entry with real id)
      void supabaseStudent
        .from("student_crafts")
        .select("*")
        .eq("student_id", studentId)
        .then(({ data: craftedData }) => {
          if (craftedData) setCrafted(craftedData as StudentCraft[]);
        });
    } finally {
      setCraftingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="holo-panel flex justify-center py-8">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  if (!recipes.length) {
    return (
      <div className="holo-panel text-center py-10">
        <GameIcon id="wand" size={40} className="mx-auto mb-3 opacity-20" />
        <p className="text-white/30 text-sm">Seu professor ainda não criou receitas de craft.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flashRarity && <CraftFlash rarity={flashRarity} />}

      <div
        className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2 px-1 mb-2"
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45" style={{ background: "#a855f7" }} />
        Craft
      </div>

      {recipes.map((recipe) => {
        const meta = RARITY_META[recipe.rarity] ?? RARITY_META.common;
        const ingredients = Array.isArray(recipe.ingredient_nodes) ? recipe.ingredient_nodes : [];
        const alreadyCrafted = craftedRecipeIds.has(recipe.id);
        const ready = canCraft(recipe) && !alreadyCrafted;

        return (
          <div
            key={recipe.id}
            className="rounded-xl p-4"
            style={{
              background: meta.color,
              border: `1px solid ${meta.glow}30`,
              boxShadow: ready ? `0 0 16px ${meta.glow}20` : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: `${meta.glow}15`, border: `1px solid ${meta.glow}30` }}
                >
                  <GameIcon id={recipe.icon || "wand"} size={22} ringColor={meta.glow} />
                </div>
                <div className="min-w-0">
                  <h3
                    className="font-bold text-sm text-white leading-tight"
                    style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.5px" }}
                  >
                    {recipe.name}
                  </h3>
                  {recipe.description && (
                    <p className="text-xs text-white/40 mt-0.5 truncate">{recipe.description}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{ color: meta.glow, background: `${meta.glow}20`, border: `1px solid ${meta.glow}40` }}
                >
                  {meta.label}
                </span>
                {alreadyCrafted && (
                  <span className="text-xs text-yellow-400 font-bold flex items-center gap-1">
                    <GameIcon id="trophy" size={10} /> Criado
                  </span>
                )}
              </div>
            </div>

            {/* Ingredients */}
            <div className="mb-3">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-1.5" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                Ingredientes
              </p>
              <div className="space-y-1">
                {ingredients.map((nodeId) => {
                  const node = allNodes.find((n) => n.id === nodeId);
                  const done = completedNodeIds.has(nodeId);
                  return (
                    <div key={nodeId} className="flex items-center gap-2 text-xs">
                      {done ? (
                        <Check size={12} className="text-green-400 flex-shrink-0" />
                      ) : (
                        <X size={12} className="text-red-400 flex-shrink-0" />
                      )}
                      <span style={{ color: done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                        {node?.name ?? nodeId.slice(0, 8) + "..."}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Result */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/40 flex items-center gap-2 flex-wrap">
                {recipe.result_coins > 0 && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <GameIcon id="coin" size={10} /> {recipe.result_coins} moedas
                  </span>
                )}
                {recipe.result_xp > 0 && (
                  <span className="flex items-center gap-1 text-cyan-400">
                    <GameIcon id="star" size={10} /> {recipe.result_xp} XP
                  </span>
                )}
              </div>

              {alreadyCrafted ? (
                <div
                  className="text-xs px-3 py-1.5 rounded-lg font-bold"
                  style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "#ffd700" }}
                >
                  Já criado
                </div>
              ) : (
                <button
                  onClick={() => ready && doCraft(recipe)}
                  disabled={!ready || craftingId === recipe.id}
                  className={`text-xs px-4 py-1.5 rounded-lg font-bold transition-all ${
                    ready ? "btn-cyber" : ""
                  }`}
                  style={
                    !ready
                      ? {
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.2)",
                          cursor: "not-allowed",
                          fontFamily: "Rajdhani, sans-serif",
                          letterSpacing: "1px",
                        }
                      : undefined
                  }
                >
                  {craftingId === recipe.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : ready ? (
                    "CRAFTAR"
                  ) : (
                    "Ingredientes faltando"
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
