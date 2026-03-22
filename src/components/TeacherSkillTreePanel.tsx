import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameIcon } from "@/components/icons/GameIcon";
import type { SkillTree, SkillNode } from "@/types";

interface TeacherSkillTreePanelProps {
  teacherId: string;
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
};

interface NodeWithChildren extends SkillNode {
  children: NodeWithChildren[];
}

function buildTree(nodes: SkillNode[]): NodeWithChildren[] {
  const map = new Map<string, NodeWithChildren>();
  nodes.forEach(n => map.set(n.id, { ...n, children: [] }));
  const roots: NodeWithChildren[] = [];
  map.forEach(node => {
    if (node.parent_node_id && map.has(node.parent_node_id)) {
      map.get(node.parent_node_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function NodeItem({
  node,
  depth,
  onDelete,
}: {
  node: NodeWithChildren;
  depth: number;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <div
        className="flex items-center justify-between py-2 px-3 rounded-lg"
        style={{
          marginLeft: `${depth * 20}px`,
          background: depth === 0 ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${depth === 0 ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
          marginBottom: '4px',
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {depth > 0 && (
            <span className="text-white/20 text-xs flex-shrink-0">{'└─'}</span>
          )}
          <GameIcon id={node.icon || 'star'} size={14} />
          <span className="text-sm text-white/80 font-medium truncate" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {node.name}
          </span>
          {node.reward_coins > 0 && (
            <span className="text-xs text-yellow-400 flex-shrink-0 flex items-center gap-1">
              <GameIcon id="coin" size={12} /> {node.reward_coins}
            </span>
          )}
          {node.description && (
            <span className="text-xs text-white/30 truncate hidden sm:block">{node.description}</span>
          )}
        </div>
        <button
          onClick={() => onDelete(node.id)}
          className="p-1.5 rounded text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
          title="Excluir nó"
        >
          <Trash2 size={13} />
        </button>
      </div>
      {node.children.map(child => (
        <NodeItem key={child.id} node={child} depth={depth + 1} onDelete={onDelete} />
      ))}
    </div>
  );
}

export function TeacherSkillTreePanel({ teacherId }: TeacherSkillTreePanelProps) {
  const [trees, setTrees] = useState<SkillTree[]>([]);
  const [nodesPerTree, setNodesPerTree] = useState<Record<string, SkillNode[]>>({});
  const [expandedTree, setExpandedTree] = useState<string | null>(null);
  const [showCreateTree, setShowCreateTree] = useState(false);
  const [showAddNodeFor, setShowAddNodeFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTree, setIsSavingTree] = useState(false);
  const [isSavingNode, setIsSavingNode] = useState(false);
  const [deletingTreeId, setDeletingTreeId] = useState<string | null>(null);

  const [treeForm, setTreeForm] = useState({ name: '', description: '' });
  const [nodeForm, setNodeForm] = useState({
    name: '',
    description: '',
    parent_node_id: '',
    reward_coins: 0,
    position_x: 0,
    position_y: 0,
    icon: 'star',
  });

  useEffect(() => {
    loadTrees();
  }, [teacherId]);

  async function loadTrees() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('skill_trees')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar árvores de habilidade');
    } else {
      setTrees((data || []) as unknown as SkillTree[]);
    }
    setIsLoading(false);
  }

  async function loadNodes(treeId: string) {
    const { data, error } = await supabase
      .from('skill_nodes')
      .select('*')
      .eq('tree_id', treeId)
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar nós');
    } else {
      setNodesPerTree(prev => ({ ...prev, [treeId]: (data || []) as unknown as SkillNode[] }));
    }
  }

  function toggleTree(treeId: string) {
    if (expandedTree === treeId) {
      setExpandedTree(null);
      setShowAddNodeFor(null);
    } else {
      setExpandedTree(treeId);
      if (!nodesPerTree[treeId]) {
        loadNodes(treeId);
      }
    }
  }

  async function handleCreateTree(e: React.FormEvent) {
    e.preventDefault();
    if (!treeForm.name.trim()) return;
    setIsSavingTree(true);
    const { error } = await supabase.from('skill_trees').insert({
      teacher_id: teacherId,
      name: treeForm.name.trim(),
      description: treeForm.description.trim() || null,
      icon: 'star',
    });

    if (error) {
      toast.error('Erro ao criar árvore', { description: error.message });
    } else {
      toast.success('Árvore de habilidade criada!');
      setShowCreateTree(false);
      setTreeForm({ name: '', description: '' });
      await loadTrees();
    }
    setIsSavingTree(false);
  }

  async function handleCreateNode(e: React.FormEvent, treeId: string) {
    e.preventDefault();
    if (!nodeForm.name.trim()) return;
    setIsSavingNode(true);
    const existingNodes = nodesPerTree[treeId] ?? [];
    const { error } = await supabase.from('skill_nodes').insert({
      tree_id: treeId,
      name: nodeForm.name.trim(),
      description: nodeForm.description.trim() || null,
      parent_node_id: nodeForm.parent_node_id || null,
      reward_coins: nodeForm.reward_coins,
      position_x: nodeForm.position_x,
      position_y: nodeForm.position_y,
      icon: nodeForm.icon.trim() || 'star',
      sort_order: existingNodes.length,
      reward_title: null,
    });

    if (error) {
      toast.error('Erro ao criar nó', { description: error.message });
    } else {
      toast.success('Nó adicionado!');
      setShowAddNodeFor(null);
      setNodeForm({ name: '', description: '', parent_node_id: '', reward_coins: 0, position_x: 0, position_y: 0, icon: 'star' });
      await loadNodes(treeId);
    }
    setIsSavingNode(false);
  }

  async function handleDeleteNode(nodeId: string, treeId: string) {
    if (!confirm('Excluir este nó? Todos os nós filhos perderão seu pai.')) return;
    const { error } = await supabase.from('skill_nodes').delete().eq('id', nodeId);
    if (error) {
      toast.error('Erro ao excluir nó', { description: error.message });
    } else {
      toast.success('Nó excluído');
      await loadNodes(treeId);
    }
  }

  async function handleDeleteTree(treeId: string) {
    if (!confirm('Excluir esta árvore e todos os seus nós?')) return;
    setDeletingTreeId(treeId);
    const { error } = await supabase.from('skill_trees').delete().eq('id', treeId);
    if (error) {
      toast.error('Erro ao excluir árvore', { description: error.message });
    } else {
      toast.success('Árvore excluída');
      if (expandedTree === treeId) setExpandedTree(null);
      await loadTrees();
    }
    setDeletingTreeId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin text-cyan-400" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network size={18} className="text-cyan-400" />
          <span className="text-white/60 text-sm">
            {trees.length} árvore{trees.length !== 1 ? 's' : ''} de habilidade
          </span>
        </div>
        <button onClick={() => setShowCreateTree(v => !v)} className="btn-cyber">
          <Plus size={16} />
          Nova Árvore
        </button>
      </div>

      {/* Create Tree Form */}
      {showCreateTree && (
        <div className="holo-panel space-y-4" style={{ border: '1px solid rgba(0,229,255,0.2)' }}>
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Nova Árvore de Habilidade
          </h3>
          <form onSubmit={handleCreateTree} className="space-y-3">
            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Nome *</label>
              <input
                type="text"
                value={treeForm.name}
                onChange={e => setTreeForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Árvore de Programação"
                required
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Descrição</label>
              <input
                type="text"
                value={treeForm.description}
                onChange={e => setTreeForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição opcional"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={inputStyle}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isSavingTree} className="btn-cyber">
                {isSavingTree ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Criar Árvore
              </button>
              <button
                type="button"
                onClick={() => setShowCreateTree(false)}
                className="px-4 py-2 rounded-lg text-white/50 hover:text-white/80 transition-colors text-sm"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trees List */}
      {trees.length === 0 ? (
        <div className="holo-panel text-center py-10">
          <Network size={48} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/40">Nenhuma árvore de habilidade criada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trees.map(tree => {
            const isExpanded = expandedTree === tree.id;
            const nodes = nodesPerTree[tree.id] ?? [];
            const nodeTree = buildTree(nodes);
            const isAddingNode = showAddNodeFor === tree.id;

            return (
              <div key={tree.id} className="holo-panel" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}
                  >
                    <Network size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                      {tree.name}
                    </h3>
                    {tree.description && (
                      <p className="text-white/50 text-sm">{tree.description}</p>
                    )}
                    <p className="text-xs text-white/30 mt-0.5">{nodes.length} nó{nodes.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleTree(tree.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white/90 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Recolher' : 'Ver Nós'}
                    </button>
                    <button
                      onClick={() => handleDeleteTree(tree.id)}
                      disabled={deletingTreeId === tree.id}
                      className="p-2 rounded-lg text-white/30 hover:text-red-400 transition-colors"
                      title="Excluir árvore"
                    >
                      {deletingTreeId === tree.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Nodes */}
                    {nodeTree.length === 0 ? (
                      <p className="text-white/30 text-sm">Nenhum nó ainda. Adicione o primeiro!</p>
                    ) : (
                      <div className="space-y-1">
                        {nodeTree.map(node => (
                          <NodeItem
                            key={node.id}
                            node={node}
                            depth={0}
                            onDelete={id => handleDeleteNode(id, tree.id)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Add Node Button */}
                    {!isAddingNode && (
                      <button
                        onClick={() => {
                          setShowAddNodeFor(tree.id);
                          setNodeForm({ name: '', description: '', parent_node_id: '', reward_coins: 0, position_x: 0, position_y: 0, icon: 'star' });
                        }}
                        className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors py-1"
                      >
                        <Plus size={14} /> Adicionar Nó
                      </button>
                    )}

                    {/* Add Node Form */}
                    {isAddingNode && (
                      <div className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}>
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          Novo Nó
                        </h4>
                        <form onSubmit={e => handleCreateNode(e, tree.id)} className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Nome *</label>
                              <input
                                type="text"
                                value={nodeForm.name}
                                onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Ex: Variáveis"
                                required
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Ícone</label>
                              <input
                                type="text"
                                value={nodeForm.icon}
                                onChange={e => setNodeForm(f => ({ ...f, icon: e.target.value }))}
                                placeholder="ex: star"
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={inputStyle}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Descrição</label>
                            <input
                              type="text"
                              value={nodeForm.description}
                              onChange={e => setNodeForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="Descrição do nó"
                              className="w-full px-3 py-2 rounded-lg text-sm"
                              style={inputStyle}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Nó Pai</label>
                              <select
                                value={nodeForm.parent_node_id}
                                onChange={e => setNodeForm(f => ({ ...f, parent_node_id: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={inputStyle}
                              >
                                <option value="">Raiz (sem pai)</option>
                                {nodes.map(n => (
                                  <option key={n.id} value={n.id}>{n.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Recompensa (moedas)</label>
                              <input
                                type="number"
                                min={0}
                                value={nodeForm.reward_coins}
                                onChange={e => setNodeForm(f => ({ ...f, reward_coins: Number(e.target.value) }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={inputStyle}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Posição X <span className="text-white/25">(visual)</span></label>
                              <input
                                type="number"
                                min={0}
                                value={nodeForm.position_x}
                                onChange={e => setNodeForm(f => ({ ...f, position_x: Number(e.target.value) }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={inputStyle}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Posição Y <span className="text-white/25">(visual)</span></label>
                              <input
                                type="number"
                                min={0}
                                value={nodeForm.position_y}
                                onChange={e => setNodeForm(f => ({ ...f, position_y: Number(e.target.value) }))}
                                className="w-full px-3 py-2 rounded-lg text-sm"
                                style={inputStyle}
                              />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button type="submit" disabled={isSavingNode} className="btn-cyber">
                              {isSavingNode ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                              Adicionar
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddNodeFor(null)}
                              className="px-3 py-1.5 rounded-lg text-white/50 hover:text-white/80 transition-colors text-sm"
                              style={{ background: 'rgba(255,255,255,0.04)' }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
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
