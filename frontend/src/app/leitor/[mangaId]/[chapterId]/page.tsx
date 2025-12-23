"use client";

import React, { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
// CORREÇÃO AQUI: Importamos Lock como LockIcon para evitar conflito com API do navegador
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Loader2, MessageSquare, 
  Crown, Zap, Lock as LockIcon 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { CommentSection } from "@/components/ui/CommentSection";

interface NeighborChapter {
  id: string;
  isLocked: boolean;
  price: number;
}

export default function ReaderPage({ params }: { params: Promise<{ mangaId: string; chapterId: string }> }) {
  const { mangaId, chapterId } = use(params);
  const router = useRouter();
  const { patinhas, addPatinhas, isAuthenticated } = useUserStore();

  // Estados de Dados
  const [pages, setPages] = useState<string[]>([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  
  // Vizinhos
  const [prev, setPrev] = useState<NeighborChapter | null>(null);
  const [next, setNext] = useState<NeighborChapter | null>(null);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUI, setShowUI] = useState(true);

  // Estados de Compra (Modal)
  const [showModal, setShowModal] = useState(false);
  const [targetChapter, setTargetChapter] = useState<NeighborChapter | null>(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [myLiteBalance, setMyLiteBalance] = useState(0);

  // 1. REGISTRAR VIEW
  useEffect(() => {
    if (mangaId) api.post(`/works/${mangaId}/view`).catch(console.error);
  }, [mangaId, chapterId]);

  // 2. BUSCAR CAPÍTULO
  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      setError("");
      setPages([]);
      
      try {
        const res = await api.get(`/chapters/${chapterId}/content`);
        setPages(res.data.pages);
        setChapterTitle(res.data.title || "");
        setChapterNumber(res.data.number);
        setPrev(res.data.prev);
        setNext(res.data.next);

        // Atualiza saldo lite silenciosamente
        if (isAuthenticated) {
            api.get('/auth/profile').then(r => setMyLiteBalance(r.data.patinhasLite || 0));
        }

      } catch (err: any) {
        if (err.response?.status === 403) setError("Você precisa desbloquear este capítulo para ler.");
        else if (err.response?.status === 404) setError("Capítulo não encontrado.");
        else setError("Erro ao carregar imagens.");
      } finally {
        setLoading(false);
      }
    }
    fetchPages();
  }, [chapterId, isAuthenticated]);

  // --- NAVEGAÇÃO ---
  const handleNav = (neighbor: NeighborChapter | null) => {
    if (!neighbor) return;

    if (neighbor.isLocked) {
      // Se bloqueado, abre modal
      setTargetChapter(neighbor);
      setShowModal(true);
    } else {
      // Se liberado, vai direto
      router.push(`/leitor/${mangaId}/${neighbor.id}`);
    }
  };

  const handleBackToWork = () => router.push(`/obra/${mangaId}`);

  // --- COMPRA ---
  const confirmPurchase = async (method: 'premium' | 'lite') => {
    if (!isAuthenticated) return router.push("/login");
    if (!targetChapter) return;

    setProcessingPurchase(true);
    try {
      const response = await api.post(`/chapters/${targetChapter.id}/unlock`, { method });
      
      if (response.data.success) {
        // Atualiza saldos visuais
        if (method === 'premium' && response.data.newBalance !== undefined) {
             addPatinhas(response.data.newBalance - patinhas);
        } else if (method === 'lite') {
             setMyLiteBalance(response.data.newBalanceLite);
        }

        setShowModal(false);
        // Navega para o capítulo comprado
        router.push(`/leitor/${mangaId}/${targetChapter.id}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro na compra");
    } finally {
      setProcessingPurchase(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-gato-purple w-10 h-10"/></div>;

  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6 p-4">
      <h1 className="text-2xl font-bold text-red-500 text-center">{error}</h1>
      <button onClick={handleBackToWork} className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-full border border-white/10 transition-colors">Voltar para a Obra</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111] text-white">
      
      {/* HEADER */}
      <AnimatePresence>
        {showUI && (
          <motion.header initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }} transition={{ duration: 0.3 }} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent h-24 flex items-center px-4 md:px-8 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4 w-full">
              <button onClick={handleBackToWork} className="p-3 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/10 transition-colors border border-white/10"><ArrowLeft className="w-6 h-6" /></button>
              <div className="flex-1 min-w-0 drop-shadow-md">
                <h1 className="font-bold text-lg truncate">Capítulo {chapterNumber}</h1>
                {chapterTitle && <p className="text-xs text-gato-purple truncate">{chapterTitle}</p>}
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* LEITOR */}
      <div onClick={() => setShowUI(!showUI)} className="w-full max-w-4xl mx-auto flex flex-col items-center bg-black min-h-screen pb-10">
        {pages.map((src, index) => (
          <img key={index} src={src} alt={`Página ${index + 1}`} className="w-full h-auto block select-none" loading="lazy" style={{ display: 'block' }} />
        ))}
      </div>

      {/* RODAPÉ */}
      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">
        <div className="py-10 text-center border-b border-white/5">
            <p className="text-gato-muted text-sm uppercase tracking-widest mb-6">Fim do Capítulo</p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <button onClick={() => handleNav(prev)} disabled={!prev} className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border ${prev ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-white/10' : 'bg-zinc-900 text-zinc-600 border-transparent cursor-not-allowed opacity-50'}`}>
                  <ChevronLeft className="w-4 h-4"/> Anterior
              </button>
              
              <button 
                  onClick={() => handleNav(next)}
                  disabled={!next}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg 
                    ${next 
                        ? (next.isLocked ? 'bg-gato-amber text-black hover:brightness-110 shadow-gato-amber/20' : 'bg-gato-purple text-white hover:bg-gato-purple/80 shadow-gato-purple/20')
                        : 'bg-zinc-800 text-zinc-500 shadow-none cursor-not-allowed opacity-50'
                    }`}
              >
                  {/* CORREÇÃO AQUI: Usando LockIcon */}
                  {next?.isLocked ? <LockIcon className="w-4 h-4"/> : null} 
                  Próximo <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
        </div>

        <div className="bg-zinc-900/20 rounded-2xl border border-white/5 p-4 md:p-8">
            <div className="flex items-center gap-2 mb-6"><MessageSquare className="w-5 h-5 text-gato-purple"/><h3 className="text-xl font-bold">Comentários da Comunidade</h3></div>
            <CommentSection chapterId={chapterId} />
        </div>
      </div>

      {/* MODAL DE COMPRA */}
      <AnimatePresence>
        {showModal && targetChapter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processingPurchase && setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-gato-gray border border-white/10 w-full max-w-sm p-6 rounded-2xl shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gato-purple via-gato-amber to-gato-purple" />
               <h3 className="text-xl font-bold text-white text-center mb-2 mt-2">Próximo Capítulo Bloqueado</h3>
               <p className="text-center text-gato-muted text-sm mb-6">Escolha como deseja acessar.</p>

               <div className="space-y-3">
                   {/* Premium */}
                   <button onClick={() => confirmPurchase('premium')} disabled={processingPurchase || patinhas < targetChapter.price} className="w-full flex items-center justify-between bg-gradient-to-r from-gato-amber to-yellow-600 hover:brightness-110 disabled:opacity-50 text-black font-bold p-4 rounded-xl transition-all active:scale-95">
                        <div className="text-left"><div className="flex items-center gap-2"><Crown className="w-4 h-4" /> Acesso Vitalício</div><div className="text-[10px] opacity-80 font-normal">Nunca expira</div></div>
                        <div className="text-right"><span className="block text-sm">{targetChapter.price} 🐾</span><span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded">Saldo: {patinhas}</span></div>
                   </button>
                   {/* Lite */}
                   <button onClick={() => confirmPurchase('lite')} disabled={processingPurchase || myLiteBalance < 2} className="w-full flex items-center justify-between bg-zinc-800 border border-gato-green/30 hover:border-gato-green hover:bg-zinc-700 disabled:opacity-50 text-white font-bold p-4 rounded-xl transition-all active:scale-95">
                        <div className="text-left"><div className="flex items-center gap-2 text-gato-green"><Zap className="w-4 h-4" /> Aluguel (3 Dias)</div><div className="text-[10px] text-zinc-400 font-normal">Patinhas Lite</div></div>
                        <div className="text-right"><span className="block text-sm text-gato-green">2 Lite</span><span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">Saldo: {myLiteBalance}</span></div>
                   </button>
               </div>
               <button onClick={() => setShowModal(false)} disabled={processingPurchase} className="w-full text-center text-xs text-gato-muted hover:text-white underline mt-6">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}