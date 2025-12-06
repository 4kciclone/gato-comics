"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, Loader2, Save } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function NewWorkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    artist: "",
    coverUrl: "",
    tags: "", // Recebe como string, converte para array no submit
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Converte tags "Ação, Isekai" -> ["Ação", "Isekai"]
      const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);

      await api.post("/works", {
        ...formData,
        tags: tagsArray
      });

      // Sucesso! Volta para a lista
      router.push("/admin/works");
    } catch (error) {
      alert("Erro ao criar obra. Verifique se o título já existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/works" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Adicionar Nova Obra</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Preview da Capa (Simulado) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="aspect-[2/3] bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
            {formData.coverUrl ? (
              <img src={formData.coverUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <UploadCloud className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Preview da Capa</p>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 text-center">
            Cole a URL da imagem no formulário para ver o preview.
          </p>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Título */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Título da Obra</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple focus:ring-1 focus:ring-gato-purple outline-none transition-all"
                placeholder="Ex: The Beginning After The End"
              />
            </div>

            {/* URL da Capa */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">URL da Capa (Imagem)</label>
              <input 
                type="url" 
                required
                value={formData.coverUrl}
                onChange={(e) => setFormData({...formData, coverUrl: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none transition-all text-sm"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Autor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase">Autor</label>
                <input 
                  type="text" 
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none transition-all text-sm"
                  placeholder="Nome do Autor"
                />
              </div>
              {/* Artista */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase">Artista</label>
                <input 
                  type="text" 
                  value={formData.artist}
                  onChange={(e) => setFormData({...formData, artist: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none transition-all text-sm"
                  placeholder="Nome do Artista"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Tags (Separadas por vírgula)</label>
              <input 
                type="text" 
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none transition-all text-sm"
                placeholder="Ação, Fantasia, Isekai"
              />
            </div>

            {/* Sinopse */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase">Sinopse</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-gato-purple outline-none transition-all text-sm resize-none"
                placeholder="Escreva um resumo da história..."
              />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-gato-purple hover:bg-gato-purple/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-gato-purple/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Obra</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}