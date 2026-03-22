import { useState, useEffect } from "react";
import { Loader2, Lock, Check, X } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { GameIcon } from "@/components/icons/GameIcon";
import { toast } from "sonner";
import type { SkillTree, SkillNode, SkillProgress } from "@/types";

// ─── Node visual ─────────────────────────────────────────────────────────────

const NODE_SIZE = 64;
const GRID_STEP = 96;
const OFFSET_X = 16;
const OFFSET_Y = 16;

function nodeCenter(node: SkillNode) {
  return {
    x: node.position_x * GRID_STEP + OFFSET_X + NODE_SIZE / 2,
    y: node.position_y * GRID_STEP + OFFSET_Y + NODE_SIZE / 2,
  };
}

// ─── TreeCanvas ───────────────────────────────────────────────────────────────

interface TreeCanvasProps {
  tree: SkillTree;
  nodes: SkillNode[];
  progress: SkillProgress[];
  onNodeClick: (node: SkillNode) => void;
}

function TreeCanvas({ nodes, progress, onNodeClick }: TreeCanvasProps) {
  const completedIds = new Set(progress.filter((p) => p.completed).map((p) => p.node_id));

  function isCompleted(nodeId: string) {
    return completedIds.has(nodeId);
  }

  function isAvailable(node: SkillNode) {
    if (isCompleted(node.id)) return false;
    if (!node.parent_node_id) return true; // root always available
    return isCompleted(node.parent_node_id);
  }

  if (!nodes.length) {
    return <p className="text-white/30 text-sm text-center py-8">Nenhum nó nesta árvore ainda.</p>;
  }

  const maxX = Math.max(...nodes.map((n) => n.position_x), 2);
  const maxY = Math.max(...nodes.map((n) => n.position_y), 2);
  const svgWidth = (maxX + 1) * GRID_STEP + NODE_SIZE + OFFSET_X * 2;
  const svgHeight = (maxY + 1) * GRID_STEP + NODE_SIZE + OFFSET_Y * 2;

  return (
    <div className="overflow-auto pb-4" style={{ maxHeight: "480px" }}>
      <div className="relative" style={{ width: svgWidth, height: svgHeight, minWidth: "100%" }}>
        {/* Connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={svgWidth}
          height={svgHeight}
        >
          {nodes.map((node) => {
            if (!node.parent_node_id) return null;
            const parent = nodes.find((n) => n.id === node.parent_node_id);
            if (!parent) return null;
            const pc = nodeCenter(parent);
            const nc = nodeCenter(node);
            const childCompleted = isCompleted(node.id);
            const parentCompleted = isCompleted(parent.id);
            return (
              <line
                key={node.id}
                x1={pc.x}
                y1={pc.y}
                x2={nc.x}
                y2={nc.y}
                stroke={
                  childCompleted && parentCompleted
                    ? "#4caf50"
                    : parentCompleted
                    ? "rgba(0,229,255,0.3)"
                    : "rgba(255,255,255,0.06)"
                }
                strokeWidth={2}
                strokeDasharray={childCompleted ? undefined : "6 4"}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const completed = isCompleted(node.id);
          const available = isAvailable(node);
          const locked = !completed && !available;
          const center = nodeCenter(node);

          const borderColor = completed ? "#4caf50" : available ? "#00e5ff" : "rgba(255,255,255,0.08)";
          const bgColor = completed
            ? "rgba(76,175,80,0.15)"
            : available
            ? "rgba(0,229,255,0.08)"
            : "rgba(255,255,255,0.02)";

          return (
            <div
              key={node.id}
              onClick={() => available && onNodeClick(node)}
              title={locked ? "Complete o nó anterior primeiro" : node.name}
              className="absolute flex flex-col items-center"
              style={{
                left: center.x - NODE_SIZE / 2 - OFFSET_X + OFFSET_X,
                top: center.y - NODE_SIZE / 2 - OFFSET_Y + OFFSET_Y,
                width: NODE_SIZE + 32,
                transform: "translateX(-16px)",
              }}
            >
              <div
                className="transition-all duration-200"
                style={{
                  width: NODE_SIZE,
                  height: NODE_SIZE,
                  borderRadius: "50%",
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: available ? "pointer" : "default",
                  boxShadow: available ? `0 0 12px ${borderColor}40` : undefined,
                  animation: available ? "glow-breathe 3s ease-in-out infinite" : undefined,
                }}
              >
                {completed ? (
                  <Check size={22} color="#4caf50" />
                ) : locked ? (
                  <Lock size={18} color="rgba(255,255,255,0.15)" />
                ) : (
                  <GameIcon id={node.icon || "wand"} size={24} ringColor="#00e5ff" />
                )}
              </div>
              <span
                className="text-center mt-1 leading-tight"
                style={{
                  fontSize: "9px",
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  color: completed ? "#4caf50" : available ? "#00e5ff" : "rgba(255,255,255,0.25)",
                  maxWidth: NODE_SIZE + 24,
                  wordBreak: "break-word",
                }}
              >
                {node.name}
              </span>
              {node.reward_coins > 0 && (
                <span
                  className="text-center"
                  style={{ fontSize: "8px", color: "rgba(255,215,0,0.5)" }}
                >
                  +{node.reward_coins}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── NodeModal ────────────────────────────────────────────────────────────────

interface NodeModalProps {
  node: SkillNode;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

function NodeModal({ node, onConfirm, onClose, isSubmitting }: NodeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-sm rounded-xl p-6"
        style={{
          background: "rgba(10,14,26,0.98)",
          border: "1px solid rgba(0,229,255,0.2)",
          boxShadow: "0 0 40px rgba(0,229,255,0.15)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,229,255,0.1)", border: "2px solid rgba(0,229,255,0.3)" }}
          >
            <GameIcon id={node.icon || "wand"} size={24} ringColor="#00e5ff" />
          </div>
          <div>
            <h3
              className="font-bold text-white"
              style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "1px", fontSize: "16px" }}
            >
              {node.name}
            </h3>
            {node.reward_coins > 0 && (
              <p className="text-xs text-yellow-400 flex items-center gap-1 mt-0.5">
                <GameIcon id="coin" size={10} /> Recompensa: {node.reward_coins} moedas
              </p>
            )}
          </div>
        </div>

        {node.description && (
          <p className="text-sm text-white/60 mb-5 leading-relaxed">{node.description}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="btn-cyber flex-1 justify-center text-sm"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SkillTreeView ────────────────────────────────────────────────────────────

interface SkillTreeViewProps {
  studentId: string;
  teacherId: string;
}

export function SkillTreeView({ studentId, teacherId }: SkillTreeViewProps) {
  const [trees, setTrees] = useState<SkillTree[]>([]);
  const [nodesByTree, setNodesByTree] = useState<Record<string, SkillNode[]>>({});
  const [progress, setProgress] = useState<SkillProgress[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [studentId, teacherId]);

  async function load() {
    setIsLoading(true);
    const [{ data: treesData }, { data: nodesData }, { data: progressData }] = await Promise.all([
      supabaseStudent.from("skill_trees").select("*").eq("teacher_id", teacherId).order("name"),
      supabaseStudent
        .from("skill_nodes")
        .select("*")
        .in(
          "tree_id",
          // will be filtered per tree after fetch
          ["00000000-0000-0000-0000-000000000000"] // placeholder; real filter below
        ),
      supabaseStudent
        .from("student_skill_progress")
        .select("*")
        .eq("student_id", studentId),
    ]);

    const fetchedTrees = (treesData ?? []) as SkillTree[];
    setTrees(fetchedTrees);
    setProgress((progressData ?? []) as SkillProgress[]);

    if (fetchedTrees.length > 0) {
      // Fetch all nodes for teacher's trees in one query
      const treeIds = fetchedTrees.map((t) => t.id);
      const { data: allNodes } = await supabaseStudent
        .from("skill_nodes")
        .select("*")
        .in("tree_id", treeIds)
        .order("sort_order");

      const byTree: Record<string, SkillNode[]> = {};
      for (const tree of fetchedTrees) byTree[tree.id] = [];
      for (const node of (allNodes ?? []) as SkillNode[]) {
        if (byTree[node.tree_id]) byTree[node.tree_id].push(node);
      }
      setNodesByTree(byTree);
      setSelectedTreeId((prev) => prev ?? fetchedTrees[0].id);
    }

    setIsLoading(false);
  }

  async function confirmNode(node: SkillNode) {
    setIsSubmitting(true);
    const { data, error } = await supabaseStudent.rpc("complete_skill_node" as never, {
      p_student_id: studentId,
      p_node_id: node.id,
    });
    setIsSubmitting(false);
    setSelectedNode(null);

    if (error) {
      toast.error("Erro ao completar nó: " + error.message);
      return;
    }

    const result = data as { success: boolean; error?: string; reward_coins?: number };
    if (!result.success) {
      toast.error(result.error ?? "Não foi possível completar este nó.");
      return;
    }

    if (result.reward_coins && result.reward_coins > 0) {
      toast.success(`${node.name} concluído! +${result.reward_coins} moedas`, { duration: 3000 });
    } else {
      toast.success(`${node.name} concluído!`);
    }

    // Refresh progress
    const { data: refreshed } = await supabaseStudent
      .from("student_skill_progress")
      .select("*")
      .eq("student_id", studentId);
    setProgress((refreshed ?? []) as SkillProgress[]);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!trees.length) {
    return (
      <div className="holo-panel text-center py-12">
        <GameIcon id="wand" size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-white/30 text-sm">Seu professor ainda não criou árvores de habilidades.</p>
      </div>
    );
  }

  const currentTree = trees.find((t) => t.id === selectedTreeId) ?? trees[0];
  const currentNodes = nodesByTree[currentTree.id] ?? [];
  const completedCount = currentNodes.filter((n) => progress.some((p) => p.node_id === n.id && p.completed)).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="holo-panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            <GameIcon id="wand" size={20} />
            Skill Trees
          </h2>
          <span className="text-xs text-white/40">
            {completedCount}/{currentNodes.length} concluídos
          </span>
        </div>

        {/* Tree selector */}
        {trees.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {trees.map((tree) => (
              <button
                key={tree.id}
                onClick={() => setSelectedTreeId(tree.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selectedTreeId === tree.id ? "rgba(0,229,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selectedTreeId === tree.id ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: selectedTreeId === tree.id ? "#00e5ff" : "rgba(255,255,255,0.4)",
                  fontFamily: "Rajdhani, sans-serif",
                }}
              >
                {tree.name}
              </button>
            ))}
          </div>
        )}

        {currentTree.description && (
          <p className="text-xs text-white/40 mb-4">{currentTree.description}</p>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-white/30 mb-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: "rgba(76,175,80,0.5)", border: "1px solid #4caf50" }} />
            Concluído
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: "rgba(0,229,255,0.3)", border: "1px solid #00e5ff" }} />
            Disponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
            Bloqueado
          </span>
        </div>

        <TreeCanvas
          tree={currentTree}
          nodes={currentNodes}
          progress={progress}
          onNodeClick={setSelectedNode}
        />
      </div>

      {selectedNode && (
        <NodeModal
          node={selectedNode}
          onConfirm={() => confirmNode(selectedNode)}
          onClose={() => setSelectedNode(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
