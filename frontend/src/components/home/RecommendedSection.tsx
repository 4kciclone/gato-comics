"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Sparkles, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface Work {
  id: string;
  title: string;
  coverUrl: string;
  rating: string;
  status: string;
  _count: { chapters: number };
}

export function RecommendedSection() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca na rota nova (que usa lógica de popularidade ou user history)
    api.get('/works/recommendations')
       .then(res => setWorks(res.data))
       .catch(err => console.error(err))
       .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"/></div>;
  if (works.length === 0) return null;

  return (
    <section className="py-12 bg-[#0a0a0a]">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-[#FFD700] p-2 rounded-lg text-black">
                    <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Recomendado para Você</h2>
                    <p className="text-zinc-500 text-xs">Baseado no que você curte (ou nos hits do momento)</p>
                </div>
            </div>
        </div>

        {/* Lista Horizontal (Scrollável no Mobile, Grid no Desktop) */}
        <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-4 lg:grid-cols-5 scrollbar-thin scrollbar-thumb-zinc-800">
            {works.map((work, index) => (
                <motion.div
                    key={work.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="min-w-[150px] md:min-w-0"
                >
                    <Link href={`/obra/${work.id}`} className="group block h-full">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-white/5 group-hover:border-[#FFD700] transition-colors">
                            <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            
                            {/* Overlay Gradiente */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                            
                            {/* Nota flutuante */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs font-bold text-[#FFD700]">
                                <Star className="w-3 h-3 fill-current" /> {Number(work.rating).toFixed(1)}
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 group-hover:text-[#FFD700] transition-colors">
                            {work.title}
                        </h3>
                        <p className="text-zinc-500 text-xs mt-1">{work._count.chapters} Capítulos</p>
                    </Link>
                </motion.div>
            ))}
        </div>

      </div>
    </section>
  );
}