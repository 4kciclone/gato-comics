"use client";

import React, { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { CommentSection } from "@/components/ui/CommentSection";

export default function ReaderPage({ params }: { params: Promise<{ mangaId: string; chapterId: string }> }) {
  const { mangaId, chapterId } = use(params);
  const router = useRouter();

  // Estados de Dados
  const [pages, setPages] = useState<string[]>([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  
  // Estados de Navegação (IDs dos vizinhos)
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUI, setShowUI] = useState(true);

  // 1. REGISTRAR VIEW
  useEffect(() => {
    if (mangaId) {
      api.post(`/works/${mangaId}/view`).catch(err => console.error(err));
    }
  }, [mangaId, chapterId]);

  // 2. BUSCAR CAPÍTULO
  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      setError("");
      setPages([]); // Limpa páginas anteriores para não piscar
      
      try {
        const res = await api.get(`/chapters/${chapterId}/content`);
        setPages(res.data.pages);
        setChapterTitle(res.data.title || "");
        setChapterNumber(res.data.number);
        
        // Salva os IDs de navegação vindos do backend
        setPrevId(res.data.prevId);
        setNextId(res.data.nextId);

      } catch (err: any) {
        if (err.response?.status === 403) {
          setError("Você precisa desbloquear este capítulo para ler.");
        } else if (err.response?.status === 404) {
          setError("Capítulo não encontrado.");
        } else {
          setError("Erro ao carregar imagens.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPages();
  }, [chapterId]);

  // --- FUNÇÕES DE NAVEGAÇÃO ---
  const handlePrev = () => {
    if (prevId) router.push(`/leitor/${mangaId}/${prevId}`);
  };

  const handleNext = () => {
    if (nextId) router.push(`/leitor/${mangaId}/${nextId}`);
  };

  const handleBackToWork = () => {
    router.push(`/obra/${mangaId}`);
  };

  // --- LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-gato-purple w-10 h-10"/>
      </div>
    );
  }

  // --- ERRO / BLOQUEIO ---
  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6 p-4">
        <h1 className="text-2xl font-bold text-red-500 text-center">{error}</h1>
        <button 
          onClick={handleBackToWork} 
          className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-full border border-white/10 transition-colors"
        >
          Voltar para a Obra
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white">
      
      {/* HEADER FLUTUANTE */}
      <AnimatePresence>
        {showUI && (
          <motion.header
            initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent h-24 flex items-center px-4 md:px-8 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center gap-4 w-full">
              <button 
                onClick={handleBackToWork} 
                className="p-3 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/10 transition-colors border border-white/10"
                title="Voltar"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex-1 min-w-0 drop-shadow-md">
                <h1 className="font-bold text-lg truncate">
                    Capítulo {chapterNumber}
                </h1>
                {chapterTitle && <p className="text-xs text-gato-purple truncate">{chapterTitle}</p>}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* LEITURA */}
      <div 
        onClick={() => setShowUI(!showUI)} 
        className="w-full max-w-4xl mx-auto flex flex-col items-center bg-black min-h-screen pb-10"
      >
        {pages.map((src, index) => (
          <img 
            key={index}
            src={src}
            alt={`Página ${index + 1}`}
            className="w-full h-auto block select-none"
            loading="lazy"
            style={{ display: 'block' }}
          />
        ))}
      </div>

      {/* RODAPÉ E NAVEGAÇÃO */}
      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">
        
        <div className="py-10 text-center border-b border-white/5">
            <p className="text-gato-muted text-sm uppercase tracking-widest mb-6">Fim do Capítulo</p>
            
            <div className="flex flex-col md:flex-row justify-center gap-4">
              
              {/* Botão Anterior */}
              <button 
                  onClick={handlePrev}
                  disabled={!prevId}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border 
                    ${prevId 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-white/10' 
                        : 'bg-zinc-900 text-zinc-600 border-transparent cursor-not-allowed opacity-50'
                    }`}
              >
                  <ChevronLeft className="w-4 h-4"/> Anterior
              </button>
              
              {/* Botão Próximo */}
              <button 
                  onClick={handleNext}
                  disabled={!nextId}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg 
                    ${nextId 
                        ? 'bg-gato-purple hover:bg-gato-purple/80 text-white shadow-gato-purple/20' 
                        : 'bg-zinc-800 text-zinc-500 shadow-none cursor-not-allowed opacity-50'
                    }`}
              >
                  Próximo <ChevronRight className="w-4 h-4"/>
              </button>

            </div>
        </div>

        {/* Comentários */}
        <div className="bg-zinc-900/20 rounded-2xl border border-white/5 p-4 md:p-8">
            <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-gato-purple"/>
                <h3 className="text-xl font-bold">Comentários da Comunidade</h3>
            </div>
            <CommentSection chapterId={chapterId} />
        </div>

      </div>

    </div>
  );
}