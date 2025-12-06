"use client";

import React, { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Loader2, Search, Star, Frown } from "lucide-react";
import { motion } from "framer-motion";

interface Work {
  id: string;
  title: string;
  coverUrl: string;
  rating: string;
  status: string;
  _count: { chapters: number };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q"); // Pega o ?q=... da URL

  const [results, setResults] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    async function fetchResults() {
      setLoading(true);
      try {
        const res = await api.get(`/works?q=${query}`);
        setResults(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    // Debounce simples (espera parar de digitar se fosse live, aqui é page load)
    fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen bg-gato-black pt-24 px-4 pb-20">
      <div className="container mx-auto">
        
        {/* Header da Busca */}
        <div className="mb-8 border-b border-white/5 pb-4">
          <h1 className="text-2xl text-white font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-gato-purple" />
            Resultados para: <span className="text-gato-muted italic">"{query}"</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Encontramos {results.length} obras correspondentes.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gato-purple" />
          </div>
        )}

        {/* Sem Resultados */}
        {!loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
            <Frown className="w-16 h-16 opacity-20" />
            <p>Nenhuma obra encontrada com esse nome.</p>
            <Link href="/" className="text-gato-purple hover:underline">Voltar para o início</Link>
          </div>
        )}

        {/* Grid de Resultados */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {results.map((manga, index) => (
            <motion.div
              key={manga.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/obra/${manga.id}`} className="group relative block w-full aspect-[2/3] rounded-xl overflow-hidden bg-gato-gray border border-white/5 hover:border-gato-purple/50 transition-all">
                <img 
                  src={manga.coverUrl} 
                  alt={manga.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                    <span className="bg-gato-purple text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        {manga.status === 'ONGOING' ? 'Lançamento' : 'Completo'}
                    </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-gato-purple transition-colors">
                    {manga.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gato-muted">
                    <Star className="w-3 h-3 text-gato-amber fill-current" />
                    <span>{Number(manga.rating).toFixed(1)}</span>
                    <span className="mx-1">•</span>
                    <span>{manga._count.chapters} caps</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}