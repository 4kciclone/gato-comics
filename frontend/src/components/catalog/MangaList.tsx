"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api"; // <--- Importando nosso cliente API

// Tipo dos dados que vêm do Backend
interface Work {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
  rating: string;
  status: string;
  // Adicione outros campos conforme necessário
}

export function MangaList() {
  const [mangas, setMangas] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar dados do Backend ao carregar
  useEffect(() => {
    async function fetchWorks() {
      try {
        const response = await api.get('/works');
        setMangas(response.data);
      } catch (error) {
        console.error("Erro ao buscar obras:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWorks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-gato-black text-gato-purple">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-8 md:py-12 bg-gato-black relative z-20">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 md:h-8 bg-gato-purple rounded-full shadow-[0_0_10px_#8A2BE2]" />
            <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">
              Lançamentos da <span className="text-gato-amber">Alcateia</span>
            </h2>
          </div>
        </div>

        {/* Grid Dinâmico */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          {mangas.map((manga, index) => (
            <motion.div
              key={manga.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/obra/${manga.id}`} className="group relative block w-full aspect-[2/3] rounded-lg md:rounded-xl overflow-hidden bg-gato-gray border border-white/5 hover:border-gato-purple/50 transition-all">
                
                {/* IMAGEM REAL DO BANCO */}
                <img 
                  src={manga.coverUrl} 
                  alt={manga.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

                {/* Status Badge (Se existir) */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {manga.status === "ONGOING" && (
                    <span className="bg-gato-purple text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">Lançamento</span>
                  )}
                  {manga.status === "COMPLETED" && (
                    <span className="bg-green-600 text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">Completo</span>
                  )}
                </div>

                {/* Rodapé do Card */}
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                  <h3 className="text-white font-bold text-xs md:text-sm leading-tight line-clamp-2 mb-1 group-hover:text-gato-purple transition-colors">
                    {manga.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-[10px] md:text-xs text-gato-muted">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-gato-amber fill-current" />
                      <span>{Number(manga.rating).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}