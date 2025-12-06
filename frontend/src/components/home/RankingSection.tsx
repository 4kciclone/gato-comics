"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, Globe, Flame, Star } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

interface RankedWork {
  id: string;
  title: string;
  coverUrl: string;
  views: number;
  rating: string;
  tags: string[];
}

export function RankingSection() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'all'>('daily');
  const [works, setWorks] = useState<RankedWork[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar dados quando a aba muda
  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      try {
        const res = await api.get(`/works/ranking?period=${period}`);
        setWorks(res.data);
      } catch (error) {
        console.error("Erro ranking", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, [period]);

  const tabs = [
    { id: 'daily', label: 'Diário', icon: Flame },
    { id: 'weekly', label: 'Semanal', icon: Calendar },
    { id: 'all', label: 'Geral', icon: Globe },
  ];

  return (
    <section className="py-12 bg-black relative overflow-hidden">
      {/* Luz de fundo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gato-purple/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Cabeçalho com Abas */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gato-amber/10 rounded-xl border border-gato-amber/20">
                <Trophy className="w-6 h-6 text-gato-amber" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Top 10 Obras</h2>
                <p className="text-zinc-500 text-sm">Os mangás mais lidos do momento</p>
            </div>
          </div>

          {/* Seletor de Abas */}
          <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
            {tabs.map((tab) => {
                const isActive = period === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setPeriod(tab.id as any)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        {isActive && (
                            <motion.div 
                                layoutId="rankingTab"
                                className="absolute inset-0 bg-white/10 rounded-lg shadow-sm"
                            />
                        )}
                        <tab.icon className={`w-4 h-4 ${isActive ? 'text-gato-purple' : ''}`} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                );
            })}
          </div>
        </div>

        {/* Lista de Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 min-h-[400px]">
            <AnimatePresence mode="wait">
                {loading ? (
                    <div className="col-span-2 flex justify-center items-center py-20">
                        <div className="w-8 h-8 border-2 border-gato-purple border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : works.length === 0 ? (
                    <div className="col-span-2 text-center py-20 text-zinc-600">
                        Nenhuma leitura registrada neste período.
                    </div>
                ) : (
                    works.map((work, index) => (
                        <motion.div
                            key={work.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link href={`/obra/${work.id}`} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-800/50 hover:border-gato-purple/30 transition-all group relative overflow-hidden">
                                
                                {/* Número do Ranking */}
                                <div className={`absolute -left-2 top-1/2 -translate-y-1/2 text-6xl font-black italic opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity
                                    ${index === 0 ? 'text-gato-amber' : index === 1 ? 'text-zinc-300' : index === 2 ? 'text-orange-700' : 'text-zinc-700'}
                                `}>
                                    #{index + 1}
                                </div>

                                {/* Capa */}
                                <div className="relative w-16 h-20 shrink-0 rounded-lg overflow-hidden shadow-lg">
                                    <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    {/* Medalhas Top 3 */}
                                    {index < 3 && (
                                        <div className={`absolute top-0 left-0 px-1.5 py-0.5 text-[8px] font-bold text-black
                                            ${index === 0 ? 'bg-gato-amber' : index === 1 ? 'bg-zinc-300' : 'bg-orange-600 text-white'}
                                        `}>
                                            #{index + 1}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 z-10">
                                    <h3 className="text-white font-bold truncate group-hover:text-gato-purple transition-colors">
                                        {work.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                        <span className="flex items-center gap-1 text-gato-amber">
                                            <Star className="w-3 h-3 fill-current" /> {Number(work.rating).toFixed(1)}
                                        </span>
                                        <span>•</span>
                                        <span>{work.tags[0]}</span>
                                    </div>
                                </div>

                                {/* Views */}
                                <div className="text-right z-10">
                                    <p className="text-sm font-bold text-white">{work.views.toLocaleString()}</p>
                                    <p className="text-[10px] text-zinc-600 uppercase">Visitas</p>
                                </div>
                            </Link>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>

      </div>
    </section>
  );
}