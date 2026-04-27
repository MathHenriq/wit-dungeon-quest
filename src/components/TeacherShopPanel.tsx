import { useState, useRef } from "react";
import { Plus, Trash2, ShoppingBag, Eye, EyeOff, Loader2, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { CATEGORY_META, ATTRIBUTES } from "@/types";
import type { ShopItem, ItemCategory } from "@/types";

interface TeacherShopPanelProps {
  teacherId: string;
  items: ShopItem[];
  onDataChanged: () => void;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "colecao" as ItemCategory,
  cost: 10,
  diamond_cost: 0,
  min_level: 1,
  icon: "⭐",
  image_url: "",
  attr_forca: 0,
  attr_destreza: 0,
  attr_inteligencia: 0,
  attr_carisma: 0,
  attr_agilidade: 0,
  attr_resistencia: 0,
};

function ItemImage({ item, size = "md" }: { item: ShopItem; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-10 h-10 text-2xl", md: "w-16 h-16 text-3xl", lg: "w-24 h-24 text-5xl" };
  return (
    <div className={`${sizes[size]} rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <span>{item.icon || CATEGORY_META[item.category]?.iconId || "📦"}</span>
      )}
    </div>
  );
}

function AttrBadges({ item }: { item: ShopItem }) {
  const active = ATTRIBUTES.filter(a => (item[a.key] ?? 0) > 0);
  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {active.map(a => (
        <span key={a.key} className="text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
          {a.iconId} +{item[a.key]} {a.label}
        </span>
      ))}
    </div>
  );
}

export function TeacherShopPanel({ teacherId, items, onDataChanged }: TeacherShopPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof typeof EMPTY_FORM, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${teacherId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("shop-items")
        .upload(path, file, { upsert: true });
      if (uploadError) {
        toast.error("Erro ao fazer upload da imagem", { description: uploadError.message });
        return;
      }
      const { data } = supabase.storage.from("shop-items").getPublicUrl(path);
      set("image_url", data.publicUrl);
      setImagePreview(data.publicUrl);
    } catch (err) {
      toast.error("Erro inesperado no upload");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Informe o nome do item"); return; }
    if (form.cost < 1) { toast.error("Preço deve ser maior que zero"); return; }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("shop_items").insert({
        teacher_id: teacherId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        cost: form.cost,
        diamond_cost: form.diamond_cost,
        min_level: form.min_level,
        icon: form.icon || CATEGORY_META[form.category].iconId,
        image_url: form.image_url.trim() || null,
        attr_forca: form.attr_forca,
        attr_destreza: form.attr_destreza,
        attr_inteligencia: form.attr_inteligencia,
        attr_carisma: form.attr_carisma,
        attr_agilidade: form.attr_agilidade,
        attr_resistencia: form.attr_resistencia,
      });
      if (error) {
        toast.error("Erro ao criar item", { description: error.message });
      } else {
        toast.success("Item criado!");
        setForm(EMPTY_FORM);
        setImagePreview("");
        setShowForm(false);
        onDataChanged();
      }
    } catch (err) {
      toast.error("Erro inesperado ao criar item");
      console.error("[TeacherShopPanel] handleCreate:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item: ShopItem) => {
    const { error } = await supabase
      .from("shop_items")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    if (error) toast.error("Erro ao atualizar item");
    else { toast.success(item.is_active ? "Item desativado" : "Item ativado"); onDataChanged(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("shop_items").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Erro ao excluir item", { description: error.message });
    else { toast.success("Item excluído"); onDataChanged(); }
    setDeleteTarget(null);
  };

  const activeItems = items.filter(i => i.is_active);
  const inactiveItems = items.filter(i => !i.is_active);

  return (
    <div className="space-y-6">
      {/* Toggle form button */}
      <button
        onClick={() => setShowForm(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
      >
        <Plus size={18} /> Novo Item
      </button>

      {/* Creation form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-card/50 rounded-lg p-4 space-y-4 border border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <ShoppingBag size={16} /> Criar Item
          </h3>

          {/* Name + Category row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="Ex: Espada de Fogo"
                required
                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Categoria *</label>
              <select
                value={form.category}
                onChange={e => set("category", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
              >
                {(Object.keys(CATEGORY_META) as ItemCategory[]).map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].iconId} {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={2}
              placeholder="Descreva o item..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border resize-none"
            />
          </div>

          {/* Cost + Diamond Cost + Min Level + Icon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">🪙 Preço (moedas) *</label>
              <input
                type="number"
                min="1"
                value={form.cost}
                onChange={e => set("cost", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">💎 Preço (diamantes)</label>
              <input
                type="number"
                min="0"
                value={form.diamond_cost}
                onChange={e => set("diamond_cost", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                placeholder="0 = desativado"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Nível mínimo</label>
              <input
                type="number"
                min="1"
                value={form.min_level}
                onChange={e => set("min_level", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Ícone (emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={e => set("icon", e.target.value)}
                placeholder="⭐"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="text-sm font-medium flex items-center gap-1 mb-1">
              <ImageIcon size={14} /> Imagem (opcional)
            </label>
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={form.image_url}
                  onChange={e => { set("image_url", e.target.value); setImagePreview(e.target.value); }}
                  placeholder="Cole uma URL ou faça upload abaixo"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFile}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50"
                  >
                    {isUploadingImage
                      ? <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                      : <><Upload size={14} /> Enviar arquivo</>}
                  </button>
                </div>
              </div>
              {imagePreview && (
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-border flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Attributes */}
          <div>
            <label className="text-sm font-medium block mb-2">Atributos (deixe 0 se não aplicável)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ATTRIBUTES.map(attr => (
                <div key={attr.key} className="flex items-center gap-2">
                  <span className="text-lg w-6">{attr.iconId}</span>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">{attr.label}</label>
                    <input
                      type="number"
                      min="0"
                      value={form[attr.key]}
                      onChange={e => set(attr.key, Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-background border border-border text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setImagePreview(""); }}
              className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {isSaving ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : "Criar Item"}
            </button>
          </div>
        </form>
      )}

      {/* Active items */}
      {activeItems.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Eye size={16} className="text-primary" /> Itens Ativos ({activeItems.length})
          </h3>
          <div className="grid gap-3">
            {activeItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive items */}
      {inactiveItems.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-muted-foreground flex items-center gap-2">
            <EyeOff size={16} /> Itens Inativos ({inactiveItems.length})
          </h3>
          <div className="grid gap-3 opacity-60">
            {inactiveItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onToggle={() => handleToggle(item)}
                onDelete={() => setDeleteTarget(item)}
              />
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="text-center py-10 text-muted-foreground">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-40" />
          <p>Nenhum item criado ainda</p>
          <p className="text-sm mt-1">Clique em "Novo Item" para começar.</p>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Item"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Alunos que possuem este item manterão a cópia no inventário.`}
      />
    </div>
  );
}

function ItemCard({
  item,
  onToggle,
  onDelete,
}: {
  item: ShopItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.colecao;
  return (
    <div className="flex items-center gap-3 bg-card/50 rounded-lg p-3 border border-border">
      <ItemImage item={item} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{item.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>
            {meta.iconId} {meta.label}
          </span>
          {item.min_level > 1 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Nv. {item.min_level}+
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm font-semibold text-gold-dark">🪙 {item.cost}</span>
          {(item.diamond_cost ?? 0) > 0 && (
            <span className="text-sm font-semibold" style={{ color: '#63b3ed' }}>💎 {item.diamond_cost}</span>
          )}
          <AttrBadges item={item} />
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onToggle}
          className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80"
          title={item.is_active ? "Desativar" : "Ativar"}
        >
          {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-destructive hover:bg-destructive/10"
          title="Excluir"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
