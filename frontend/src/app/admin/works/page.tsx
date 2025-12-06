"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { 
  Plus, Search, Filter, MoreHorizontal, 
  Edit3, Trash2, Eye, BookOpen, Layers 
} from "lucide-react";
import { motion } from "framer-motion";

// Tipo de dados da Obra (Simplificado para a lista)
interface Work {
  id: string;
  title: string;
  coverUrl: string;
  status: string;
  rating: string;
  _count: {
    chapters: number;
  };
}

export default function WorksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar Obras do Backend
  useEffect(() => {
    async function fetchWorks() {
      try {
        const res = await api.get('/works');
        setWorks(res.data);
      } catch (error) {
        console.error("Erro ao buscar obras", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWorks();
  }, []);

  // Filtragem local (Busca)
  const filteredWorks = works.filter(work => 
    work.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* --- HEADER DA PÁGINA --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-gato-purple" /> Catálogo de Obras
          </h1>
          <p className="text-zinc-400 text-sm">Gerencie todos os títulos disponíveis na plataforma.</p>
        </div>

        <Link href="/admin/works/new">
          <button className="flex items-center gap-2 bg-gato-purple hover:bg-gato-purple/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(138,43,226,0.3)] transition-all active:scale-95">
            <Plus className="w-5 h-5" /> Nova Obra
          </button>
        </Link>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="flex items-center gap-4 bg-zinc-900/50 border border-white/5 p-2 rounded-xl backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none text-white text-sm pl-10 focus:ring-0 placeholder:text-zinc-600"
          />
        </div>
        <div className="w-px h-6 bg-white/10" />
        <button className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm transition-colors">
          <Filter className="w-4 h-4" /> Filtros
        </button>
      </div>

      {/* --- LISTAGEM (TABELA ESTILIZADA) --- */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
        {/* Cabeçalho da Tabela */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-5 md:col-span-4">Obra</div>
          <div className="col-span-3 text-center">Status</div>
          <div className="col-span-2 text-center">Capítulos</div>
          <div className="col-span-2 hidden md:block text-center">Avaliação</div>
          <div className="col-span-2 md:col-span-1 text-right">Ações</div>
        </div>

        {/* Linhas (Skeleton Loading ou Dados) */}
        {loading ? (
          <div className="p-8 text-center text-zinc-500 animate-pulse">Carregando catálogo...</div>
        ) : filteredWorks.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            Nenhuma obra encontrada. Que tal criar a primeira?
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredWorks.map((work) => (
              <motion.div 
                key={work.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors group"
              >
                {/* Coluna 1: Info da Obra */}
                <div className="col-span-5 md:col-span-4 flex items-center gap-4">
                  <div className="w-12 h-16 bg-zinc-800 rounded-md overflow-hidden relative shadow-lg">
                    <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm truncate pr-4 group-hover:text-gato-purple transition-colors">
                      {work.title}
                    </h3>
                    <p className="text-xs text-zinc-500">ID: {work.id.slice(0, 8)}...</p>
                  </div>
                </div>

                {/* Coluna 2: Status */}
                <div className="col-span-3 flex justify-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border 
                    ${work.status === 'ONGOING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                      work.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                    {work.status === 'ONGOING' ? 'Em Andamento' : work.status === 'COMPLETED' ? 'Completo' : work.status}
                  </span>
                </div>

                {/* Coluna 3: Capítulos */}
                <div className="col-span-2 flex justify-center items-center gap-1 text-sm text-zinc-300">
                  <Layers className="w-4 h-4 text-zinc-600" />
                  {work._count.chapters}
                </div>

                {/* Coluna 4: Rating */}
                <div className="col-span-2 hidden md:flex justify-center items-center gap-1 text-sm text-zinc-300">
                  <span className="text-gato-amber">★</span> {Number(work.rating).toFixed(1)}
                </div>

                {/* Coluna 5: Ações */}
                <div className="col-span-2 md:col-span-1 flex justify-end gap-2">
                  <Link href={`/admin/works/${work.id}/edit`}>
                   <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Editar">
                       <Edit3 className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href={`/admin/works/${work.id}/chapters`}>
                    <button className="p-2 hover:bg-gato-purple/20 rounded-lg text-zinc-400 hover:text-gato-purple transition-colors" title="Gerenciar Capítulos">
                        <Layers className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}