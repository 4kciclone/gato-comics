"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Plus, Info, Loader2 } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

interface Work {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  bannerUrl?: string; // Se não tiver, usa coverUrl
  tags: string[];
}

export function Hero() {
  const [featured, setFeatured] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await api.get('/works/featured');
        setFeatured(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (loading) return <div className="h-[60vh] flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-gato-purple"/></div>;
  if (!featured) return null; // Não mostra nada se não tiver obra

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] overflow-hidden">
      
      {/* 1. IMAGEM DE FUNDO */}
      <div className="absolute inset-0">
        <img 
          src={featured.bannerUrl || featured.coverUrl} 
          alt={featured.title} 
          className="w-full h-full object-cover object-center opacity-100"
        />
        {/* Degradês para leitura */}
        <div className="absolute inset-0 bg-gradient-to-t from-gato-black via-gato-black/40 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-gato-black/90 via-gato-black/30 to-transparent" />
      </div>

      {/* 2. CONTEÚDO */}
      <div className="relative container mx-auto h-full flex flex-col justify-end px-4 md:px-6 pb-40 md:pb-48 z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl space-y-4"
        >
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {featured.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 text-[10px] md:text-xs font-bold text-gato-black bg-gato-amber rounded-sm uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          {/* Título */}
          <h1 className="text-4xl md:text-7xl font-extrabold text-white tracking-tight leading-none drop-shadow-xl line-clamp-2">
            {featured.title}
          </h1>

          {/* Sinopse */}
          <p className="text-gato-ghost text-sm md:text-lg line-clamp-3 md:line-clamp-2 max-w-xl drop-shadow-md">
            {featured.description}
          </p>

          {/* Botões */}
          <div className="flex flex-wrap items-center gap-3 pt-4 pointer-events-auto">
            <Link href={`/obra/${featured.id}`}>
              <button className="flex items-center gap-2 bg-gato-purple text-white px-6 py-3 md:px-8 md:py-3 rounded-full font-bold text-sm md:text-lg shadow-lg shadow-gato-purple/30 hover:bg-gato-purple/90 active:scale-95 transition-all">
                <Play className="w-5 h-5 fill-current" />
                Ler Agora
              </button>
            </Link>
            <button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 md:px-6 md:py-3 rounded-full font-semibold text-sm md:text-base hover:bg-white/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5" />
              Minha Lista
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}