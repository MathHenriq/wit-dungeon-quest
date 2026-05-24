import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Hammer, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameIcon } from "@/components/icons/GameIcon";
import type { CraftRecipe, ShopItem, SkillTree, SkillNode } from "@/types";

interface TeacherCraftPanelProps {
  teacherId: string;
  shopItems: ShopItem[];
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
};

const RARITIES: Array<{ value: CraftRecipe['rarity']; label: string; color: string; bg: string }> = [
  { value: 'common',    label: 'Comum',     color: 'text-gray-400',   bg: 'rgba(156,163,175,0.2)' },
  { value: 'uncommon',  label: 'Incomum',   color: 'text-green-400',  bg: 'rgba(74,222,128,0.15)' },
  { value: 'rare',      label: 'Raro',      color: 'text-cyan-400',   bg: 'rgba(0,229,255,0.15)' },
  { value: 'epic',      label: 'Épico',     color: 'text-purple-400', bg: 'rgba(168,85,247,0.15)' },
  { value: 'legendary', label: 'Lendário',  color: 'text-yellow-400', bg: 'rgba(255,215,0,0.15)' },
];

function RarityBadge({ rarity }: { rarity: CraftRecipe['rarity'] }) {
  const r = RARITIES.find(x => x.value === rarity) ?? RARITIES[0];
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.color}`}
      style={{ background: r.bg, border: `1px solid ${r.bg}` }}
    >
      {r.label}
    </span>
  );
}

export function TeacherCraftPanel({ teacherId, shopItems }: TeacherCraftPanelProps) {
  const [recipes, setRecipes] = useState<CraftRecipe[]>([]);
  const [trees, setTrees] = useState<SkillTree[]>([]);
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    rarity: 'common' as CraftRecipe['rarity'],
    selectedNodes: [] as string[],
    resultType: 'coins' as 'coins' | 'item',
    result_coins: 20,
    result_xp: 10,
    result_item_id: '',
  });

  useEffect(() => {
    loadAll();
  }, [teacherId]);

  async function loadAll() {
    setIsLoading(true);
    const [recipesRes, treesRes, nodesRes] = await Promise.all([
      supabase.from('craft_recipes')
        .select('id, teacher_id, name, description, icon, result_item_id, result_coins, result_xp, ingredient_nodes, rarity, created_at')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false }),
      supabase.from('skill_trees')
        .select('id, teacher_id, name, description, icon, created_at')
        .eq('teacher_id', teacherId),
      supabase.from('skill_nodes')
        .select('id, tree_id, name, description, icon, parent_node_id, reward_coins, reward_title, position_x, position_y, sort_order, created_at')
        .order('sort_order', { ascending: true }),
    ]);

    if (!recipesRes.error) setRecipes((recipesRes.data || []) as unknown as CraftRecipe[]);
    if (!treesRes.error) setTrees((treesRes.data || []) as unknown as SkillTree[]);
    if (!nodesRes.error) {
      // Filter nodes to only those belonging to this teacher's trees
      const treeIds = new Set((treesRes.data || []).map((t: Record<string, string>) => t.id));
      const filtered = (nodesRes.data || []).filter((n: Record<string, string>) => treeIds.has(n.tree_id));
      setNodes(filtered as unknown as SkillNode[]);
    }
    setIsLoading(false);
  }

  function getNodeName(nodeId: string): string {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return nodeId;
    const tree = trees.find(t => t.id === node.tree_id);
    return tree ? `${tree.name} — ${node.name}` : node.name;
  }

  function toggleNodeSelection(nodeId: string) {
    setForm(f => ({
      ...f,
      selectedNodes: f.selectedNodes.includes(nodeId)
        ? f.selectedNodes.filter(id => id !== nodeId)
        : [...f.selectedNodes, nodeId],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (form.selectedNodes.length < 1) {
      toast.error('Selecione pelo menos 1 ingrediente');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('craft_recipes').insert({
      teacher_id: teacherId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      rarity: form.rarity,
      ingredient_nodes: form.selectedNodes,
      result_coins: form.resultType === 'coins' ? form.result_coins : 0,
      result_xp: form.result_xp,
      result_item_id: form.resultType === 'item' && form.result_item_id ? form.result_item_id : null,
      icon: 'wand',
    });

    if (error) {
      toast.error('Erro ao criar receita', { description: error.message });
    } else {
      toast.success('Receita criada!');
      setShowCreateForm(false);
      setForm({
        name: '',
        description: '',
        rarity: 'common',
        selectedNodes: [],
        resultType: 'coins',
        result_coins: 20,
        result_xp: 10,
        result_item_id: '',
      });
      await loadAll();
    }
    setIsSaving(false);
  }

  async function handleDelete(recipeId: string) {
    if (!confirm('Excluir esta receita?')) return;
    setDeletingId(recipeId);
    const { error } = await supabase.from('craft_recipes').delete().eq('id', recipeId);
    if (error) {
      toast.error('Erro ao excluir', { description: error.message });
    } else {
      toast.success('Receita excluída');
      await loadAll();
    }
    setDeletingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin text-cyan-400" size={28} />
      </div>
    );
  }

  // Group nodes by tree
  const nodesByTree = trees.map(tree => ({
    tree,
    nodes: nodes.filter(n => n.tree_id === tree.id),
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hammer size={18} className="text-cyan-400" />
          <span className="text-white/60 text-sm">
            {recipes.length} receita{recipes.length !== 1 ? 's' : ''} de craft
          </span>
        </div>
        <button onClick={() => setShowCreateForm(v => !v)} className="btn-cyber">
          <Plus size={16} />
          Nova Receita
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="holo-panel space-y-4" style={{ border: '1px solid rgba(168,85,247,0.25)' }}>
          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Nova Receita de Craft
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Poção de Sabedoria"
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Raridade</label>
                <select
                  value={form.rarity}
                  onChange={e => setForm(f => ({ ...f, rarity: e.target.value as CraftRecipe['rarity'] }))}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={inputStyle}
                >
                  {RARITIES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Descrição</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição opcional"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={inputStyle}
              />
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">
                Ingredientes (nós de habilidade) — selecione 2 a 4
              </label>
              {nodesByTree.length === 0 ? (
                <p className="text-white/30 text-sm">Crie árvores de habilidade primeiro para usar como ingredientes</p>
              ) : (
                <div className="space-y-3">
                  {nodesByTree.map(({ tree, nodes: treeNodes }) => (
                    treeNodes.length > 0 && (
                      <div key={tree.id}>
                        <p className="text-xs text-purple-400 uppercase tracking-wider mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {tree.name}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {treeNodes.map(node => {
                            const selected = form.selectedNodes.includes(node.id);
                            return (
                              <button
                                key={node.id}
                                type="button"
                                onClick={() => toggleNodeSelection(node.id)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all"
                                style={{
                                  background: selected ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${selected ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                  color: selected ? '#a855f7' : 'rgba(255,255,255,0.6)',
                                }}
                              >
                                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: selected ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)', border: `1px solid ${selected ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
                                  {selected && <Check size={10} />}
                                </div>
                                {node.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
              {form.selectedNodes.length > 0 && (
                <p className="text-xs text-purple-400 mt-2">{form.selectedNodes.length} ingrediente{form.selectedNodes.length !== 1 ? 's' : ''} selecionado{form.selectedNodes.length !== 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Result */}
            <div>
              <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">Resultado</label>
              <div className="flex gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resultType"
                    value="coins"
                    checked={form.resultType === 'coins'}
                    onChange={() => setForm(f => ({ ...f, resultType: 'coins' }))}
                    className="accent-cyan-400"
                  />
                  <span className="text-sm text-white/70">Moedas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resultType"
                    value="item"
                    checked={form.resultType === 'item'}
                    onChange={() => setForm(f => ({ ...f, resultType: 'item' }))}
                    className="accent-cyan-400"
                  />
                  <span className="text-sm text-white/70">Item da Loja</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {form.resultType === 'coins' ? (
                  <div>
                    <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Moedas recebidas</label>
                    <input
                      type="number"
                      min={0}
                      value={form.result_coins}
                      onChange={e => setForm(f => ({ ...f, result_coins: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Item da loja</label>
                    <select
                      value={form.result_item_id}
                      onChange={e => setForm(f => ({ ...f, result_item_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                    >
                      <option value="">Selecione um item</option>
                      {shopItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">XP recebido</label>
                  <input
                    type="number"
                    min={0}
                    value={form.result_xp}
                    onChange={e => setForm(f => ({ ...f, result_xp: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isSaving} className="btn-cyber">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Hammer size={16} />}
                Criar Receita
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg text-white/50 hover:text-white/80 transition-colors text-sm"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recipes List */}
      {recipes.length === 0 ? (
        <div className="holo-panel text-center py-10">
          <Hammer size={48} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">Nenhuma receita de craft criada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map(recipe => {
            const isExpanded = expandedRecipe === recipe.id;
            const rarityInfo = RARITIES.find(r => r.value === recipe.rarity) ?? RARITIES[0];
            const resultItem = shopItems.find(i => i.id === recipe.result_item_id);

            return (
              <div
                key={recipe.id}
                className="holo-panel"
                style={{ border: `1px solid ${rarityInfo.bg}`, borderColor: rarityInfo.bg }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: rarityInfo.bg }}
                  >
                    <Hammer size={20} className={rarityInfo.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                        {recipe.name}
                      </h3>
                      <RarityBadge rarity={recipe.rarity} />
                    </div>
                    {recipe.description && (
                      <p className="text-white/50 text-sm mt-0.5">{recipe.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span>{recipe.ingredient_nodes.length} ingrediente{recipe.ingredient_nodes.length !== 1 ? 's' : ''}</span>
                      <span className="text-white/20">•</span>
                      {resultItem ? (
                        <span className="text-cyan-400">Item: {resultItem.name}</span>
                      ) : (
                        <span className="text-yellow-400 flex items-center gap-1">
                          <GameIcon id="coin" size={12} /> {recipe.result_coins} moedas
                        </span>
                      )}
                      {recipe.result_xp > 0 && (
                        <>
                          <span className="text-white/20">+</span>
                          <span className="text-purple-400">{recipe.result_xp} XP</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      disabled={deletingId === recipe.id}
                      className="p-2 rounded-lg text-white/30 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      {deletingId === recipe.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Ingredientes</p>
                        <div className="space-y-1">
                          {recipe.ingredient_nodes.map((nodeId, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-white/60">
                              <span className="text-purple-400"><GameIcon id="star" size={12} /></span>
                              {getNodeName(nodeId)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Resultado</p>
                        <div className="space-y-1">
                          {resultItem ? (
                            <div className="flex items-center gap-2 text-sm text-cyan-400">
                              <GameIcon id="wand" size={12} /> {resultItem.name}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-yellow-400">
                              <GameIcon id="coin" size={12} /> {recipe.result_coins} moedas
                            </div>
                          )}
                          {recipe.result_xp > 0 && (
                            <div className="flex items-center gap-2 text-sm text-purple-400">
                              <X size={12} className="opacity-0" /> +{recipe.result_xp} XP
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
