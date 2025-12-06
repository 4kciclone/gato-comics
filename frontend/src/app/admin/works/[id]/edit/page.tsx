"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    artist: "",
    coverUrl: "",
    tags: "",
    status: "ONGOING"
  });

  // Carregar Dados Atuais
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get(`/works/${id}`);
        const w = res.data;
        setFormData({
          title: w.title,
          description: w.description,
          author: w.author,
          artist: w.artist || "",
          coverUrl: w.coverUrl,
          tags: w.tags.join(", "), // Array p/ String
          status: w.status
        });
      } catch (error) {
        alert("Erro ao carregar obra");
        router.push("/admin/works");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  // Salvar Alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);

      await api.put(`/works/${id}`, {
        ...formData,
        tags: tagsArray
      });

      router.push("/admin/works");
    } catch (error) {
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  // Deletar Obra
  const handleDelete = async () => {
    if (!confirm("CUIDADO: Isso apagará a obra E TODOS OS CAPÍTULOS. Tem certeza?")) return;
    
    try {
      await api.delete(`/works/${id}`);
      router.push("/admin/works");
    } catch (error) {
      alert("Erro ao deletar obra.");
    }
  };

  if (loading) return <div className="p-10 text-center text-zinc-500">Carregando editor...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Link href="/admin/works" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Editar Obra</h1>
        </div>
        <button 
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
        >
            <Trash2 className="w-4 h-4" /> Excluir Obra
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Preview */}
        <div className="lg:col-span-1 space-y-4">
          <div className="aspect-[2/3] bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
            {formData.coverUrl ? (
              <img src={formData.coverUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <UploadCloud className="w-10 h-10 text-zinc-600" />
            )}
          </div>
        </div>

        {/* Formulário */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Título</label>
              <input 
                type="text" required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Capa (URL)</label>
              <input 
                type="url" required
                value={formData.coverUrl}
                onChange={(e) => setFormData({...formData, coverUrl: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase">Status</label>
                <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none"
                >
                    <option value="ONGOING">Em Lançamento</option>
                    <option value="COMPLETED">Completo</option>
                    <option value="HIATUS">Hiato</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase">Autor</label>
                <input 
                  type="text" value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Sinopse</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none resize-none"
              />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button 
                type="submit" disabled={saving}
                className="flex items-center gap-2 bg-gato-purple hover:bg-gato-purple/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Alterações</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}