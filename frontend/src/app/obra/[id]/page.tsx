"use client";

import React, { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Star, Clock, Share2, 
  Play, Lock, Unlock, Crown, Eye, Loader2, AlertCircle, 
  Heart, Bookmark, ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore"; 
import api from "@/lib/api";
import { CommentSection } from "@/components/ui/CommentSection";

interface Chapter {
  id: string;
  number: number;
  title: string;
  isFree: boolean;
  price: number;
  createdAt: string;
}

interface Work {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  bannerUrl: string | null;
  author: string;
  artist: string | null;
  status: string;
  rating: string; // Nota média geral
  tags: string[];
  chapters: Chapter[];
}

export default function MangaDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { patinhas, unlockChapter, isUnlocked, addPatinhas, isAuthenticated } = useUserStore();

  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de Interação do Usuário
  const [myRating, setMyRating] = useState(0);
  const [myStatus, setMyStatus] = useState("NENHUM");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Estados de Compra (Existentes)
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  // 1. FETCH DADOS (Obra + Interação Pessoal)
  useEffect(() => {
    async function fetchData() {
      try {
        // Busca Obra
        const workRes = await api.get(`/works/${id}`);
        setWork(workRes.data);

        // Se logado, busca interação pessoal
        if (isAuthenticated) {
          const interactionRes = await api.get(`/works/${id}/interaction`);
          setMyRating(interactionRes.data.rating || 0);
          setMyStatus(interactionRes.data.status || "NENHUM");
          setIsFavorite(interactionRes.data.isFavorite || false);
        }
      } catch (error) {
        console.error("Erro dados", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, isAuthenticated]);

  // --- AÇÕES DE INTERAÇÃO ---

  const handleFavorite = async () => {
    if (!isAuthenticated) return router.push("/login");
    const newState = !isFavorite;
    setIsFavorite(newState); // UI Otimista
    try {
      await api.post(`/works/${id}/interaction`, { isFavorite: newState });
    } catch (e) { setIsFavorite(!newState); } // Reverte se falhar
  };

  const handleRate = async (rating: number) => {
    if (!isAuthenticated) return router.push("/login");
    setMyRating(rating);
    try {
      await api.post(`/works/${id}/interaction`, { rating });
    } catch (e) {}
  };

  const handleStatusChange = async (status: string) => {
    if (!isAuthenticated) return router.push("/login");
    setMyStatus(status);
    setShowStatusMenu(false);
    try {
      await api.post(`/works/${id}/interaction`, { status });
    } catch (e) {}
  };

  // ... (Funções handleChapterClick e confirmPurchase continuam iguais) ...
  const handleChapterClick = (chapter: Chapter) => {
    const hasAccess = chapter.isFree || isUnlocked(work?.id || '', chapter.id);
    if (hasAccess) { router.push(`/leitor/${work?.id}/${chapter.id}`); return; }
    setSelectedChapter(chapter.id);
    setShowModal(true);
  };

  const confirmPurchase = async () => {
    if (!isAuthenticated) { alert("Login necessário"); return; }
    if (selectedChapter && work) {
      setProcessingPurchase(true);
      try {
        const response = await api.post(`/chapters/${selectedChapter}/unlock`);
        if (response.data.success) {
          if (response.data.newBalance !== undefined) {
             const diff = response.data.newBalance - patinhas;
             if (diff !== 0) addPatinhas(diff); 
          }
          unlockChapter(work.id, selectedChapter, 0); 
          setShowModal(false);
          router.push(`/leitor/${work.id}/${selectedChapter}`);
        }
      } catch (error: any) {
        alert(error.response?.status === 400 ? "Saldo insuficiente" : "Erro na compra");
      } finally {
        setProcessingPurchase(false);
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-gato-black flex items-center justify-center"><Loader2 className="w-12 h-12 text-gato-purple animate-spin" /></div>;
  if (!work) return <div className="p-10 text-white">Obra não encontrada</div>;

  const statusOptions = [
    { value: 'LENDO', label: 'Lendo', color: 'text-blue-400' },
    { value: 'LEREI', label: 'Vou Ler', color: 'text-yellow-400' },
    { value: 'COMPLETO', label: 'Completo', color: 'text-green-400' },
    { value: 'DROPADO', label: 'Dropado', color: 'text-red-400' },
    { value: 'NENHUM', label: 'Sem Status', color: 'text-zinc-400' },
  ];

  const currentStatusLabel = statusOptions.find(s => s.value === myStatus)?.label || "Adicionar à Biblioteca";

  return (
    <main className="min-h-screen bg-gato-black pb-24">
      
      {/* HEADER IMERSIVO */}
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <div className="absolute inset-0 overflow-hidden">
          <img src={work.bannerUrl || work.coverUrl} alt="Banner" className="w-full h-full object-cover blur-sm opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-gato-black via-gato-black/80 to-transparent" />
        </div>

        <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-8">
          <Link href="/" className="absolute top-20 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/10 transition-colors z-20">
            <ArrowLeft className="w-6 h-6" />
          </Link>

          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-end">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-32 md:w-56 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(138,43,226,0.3)] border border-white/10 shrink-0 mx-auto md:mx-0">
              <img src={work.coverUrl} alt={work.title} className="w-full h-auto" />
            </motion.div>

            <div className="flex-1 space-y-4 text-center md:text-left w-full">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-2">
                {work.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 text-[10px] font-bold bg-gato-purple/20 text-gato-purple border border-gato-purple/30 rounded uppercase">{tag}</span>
                ))}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">{work.title}</h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gato-muted">
                {/* Nota Média Geral */}
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-gato-amber fill-current" /> {Number(work.rating).toFixed(1)}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {work.status}</span>
              </div>

              {/* --- BARRA DE AÇÕES DO USUÁRIO --- */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                
                {/* Botão Ler */}
                <button 
                    onClick={() => {
                        // Tenta ir para o primeiro capítulo ou o último lido (logica futura)
                        if(work.chapters.length > 0) router.push(`/leitor/${work.id}/${work.chapters[0].id}`);
                    }}
                    className="flex-1 md:flex-none bg-gato-purple hover:bg-gato-purple/80 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" /> Ler Agora
                </button>

                {/* Botão Status (Dropdown) */}
                <div className="relative">
                    <button 
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-white/10 ${myStatus !== 'NENHUM' ? 'bg-white/10 text-white' : 'bg-black/40 text-zinc-400 hover:text-white'}`}
                    >
                        <Bookmark className={`w-5 h-5 ${myStatus !== 'NENHUM' ? 'fill-current text-gato-purple' : ''}`} />
                        {currentStatusLabel}
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </button>

                    {showStatusMenu && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
                            {statusOptions.map(opt => (
                                <button 
                                    key={opt.value}
                                    onClick={() => handleStatusChange(opt.value)}
                                    className={`text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors ${myStatus === opt.value ? 'bg-white/5 font-bold text-white' : 'text-zinc-400'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botão Favorito */}
                <button 
                    onClick={handleFavorite}
                    className={`p-3 rounded-xl border border-white/10 transition-all ${isFavorite ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-black/40 text-zinc-400 hover:text-white'}`}
                >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

              </div>

              {/* Avaliação do Usuário */}
              <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Sua Nota:</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star} 
                            onClick={() => handleRate(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star 
                                className={`w-5 h-5 ${star <= myRating ? 'text-gato-amber fill-current' : 'text-zinc-700'}`} 
                            />
                        </button>
                    ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO (Capítulos + Comentários) */}
      <div className="container mx-auto px-4 mt-8 md:mt-12 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-12">
          {/* ... Sinopse ... */}
          <section>
            <h3 className="text-xl font-bold text-white mb-3">Sinopse</h3>
            <p className="text-gato-ghost leading-relaxed text-sm md:text-base">{work.description}</p>
          </section>

          {/* ... Lista de Capítulos ... */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
              <span>Capítulos ({work.chapters.length})</span>
            </h3>
            <div className="space-y-2">
              {work.chapters.map((chapter) => {
                const isOwned = isUnlocked(work.id, chapter.id);
                const isLocked = !chapter.isFree && !isOwned;
                return (
                  <div key={chapter.id} onClick={() => handleChapterClick(chapter)} className={`group flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${isOwned ? "bg-gato-amber/5 border-gato-amber/30 hover:bg-gato-amber/10" : isLocked ? "bg-gato-gray border-white/5 hover:border-white/20 opacity-90" : "bg-white/5 border-white/5 hover:bg-white/10"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${isOwned ? 'bg-gato-amber/20' : 'bg-black/40'}`}>
                        {isOwned ? <Crown className="w-4 h-4 text-gato-amber" /> : isLocked ? <Lock className="w-4 h-4 text-gato-muted" /> : <Unlock className="w-4 h-4 text-gato-green" />}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${isOwned ? 'text-gato-amber' : 'text-white'}`}>Capítulo {chapter.number} {chapter.title ? `- ${chapter.title}` : ''}</h4>
                        <span className="text-xs text-gato-muted">{new Date(chapter.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold">
                      {isOwned ? <span className="text-gato-amber font-extrabold tracking-wider">COMPRADO</span> : chapter.isFree ? <span className="text-gato-green bg-gato-green/10 px-2 py-1 rounded">GRÁTIS</span> : <button className="flex items-center gap-1 bg-white/10 hover:bg-gato-purple hover:text-white px-3 py-1.5 rounded-full transition-colors text-gato-ghost">{chapter.price} 🐾</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ... Comentários ... */}
          <section className="border-t border-white/5 pt-8">
             <CommentSection workId={work.id} />
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="hidden md:block">
           <div className="bg-gato-gray p-6 rounded-xl border border-white/5 sticky top-24 space-y-6">
              <div>
                <h4 className="font-bold text-white mb-4">Ficha Técnica</h4>
                <ul className="space-y-3 text-sm text-gato-muted">
                  <li className="flex justify-between border-b border-white/5 pb-2"><span>Autor</span> <span className="text-white font-medium">{work.author}</span></li>
                  <li className="flex justify-between border-b border-white/5 pb-2"><span>Artista</span> <span className="text-white font-medium">{work.artist || '-'}</span></li>
                  <li className="flex justify-between border-b border-white/5 pb-2"><span>Status</span> <span className="text-gato-purple font-medium">{work.status}</span></li>
                </ul>
              </div>
              <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 p-3 rounded-lg text-sm font-bold transition-colors">
                  <Share2 className="w-4 h-4" /> Compartilhar
              </button>
           </div>
        </div>
      </div>

      {/* ... Modal ... */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processingPurchase && setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-gato-gray border border-white/10 w-full max-w-sm p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gato-purple via-gato-amber to-gato-purple" />
               <h3 className="text-xl font-bold text-white text-center mb-2 mt-2">Desbloquear Capítulo?</h3>
               <p className="text-center text-gato-muted text-sm mb-6">Tenha acesso vitalício a este capítulo agora.</p>
               <button onClick={confirmPurchase} disabled={processingPurchase} className="w-full flex items-center justify-between bg-gradient-to-r from-gato-amber to-yellow-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold p-4 rounded-xl mb-4 transition-all active:scale-95">
                  {processingPurchase ? <div className="w-full flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div> : <><span className="flex items-center gap-2"><Crown className="w-5 h-5" /> Usar 1 Patinha</span><span className="text-xs bg-black/20 px-2 py-1 rounded font-mono">Saldo: {patinhas}</span></>}
               </button>
               <button onClick={() => setShowModal(false)} disabled={processingPurchase} className="w-full text-center text-xs text-gato-muted hover:text-white underline">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}