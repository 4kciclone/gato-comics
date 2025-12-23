"use client";

import React, { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MessageSquare, Crown, Zap, Lock as LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { CommentSection } from "@/components/ui/CommentSection";

interface NeighborChapter {
  id: string;
  isLocked: boolean;
  price: number;
  number: number;
}

export default function ReaderPage({ params }: { params: Promise<{ mangaId: string; chapterId: string }> }) {
  const { mangaId, chapterId } = use(params);
  const router = useRouter();
  const { patinhas, isAuthenticated } = useUserStore(); // Removemos addPatinhas, vamos atualizar direto o state

  const [pages, setPages] = useState<string[]>([]);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  
  const [prev, setPrev] = useState<NeighborChapter | null>(null);
  const [next, setNext] = useState<NeighborChapter | null>(null);

  const [loading, setLoading] = useState(true);
  const [isCurrentLocked, setIsCurrentLocked] = useState(false);
  const [showUI, setShowUI] = useState(true);

  // Modal Compra
  const [showModal, setShowModal] = useState(false);
  const [targetChapter, setTargetChapter] = useState<NeighborChapter | null>(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [myLiteBalance, setMyLiteBalance] = useState(0);

  // 1. Registrar View
  useEffect(() => {
    if (mangaId) api.post(`/works/${mangaId}/view`).catch(console.error);
  }, [mangaId, chapterId]);

  // 2. Buscar Capítulo (e Saldo Lite atualizado)
  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      setIsCurrentLocked(false);
      setPages([]);
      
      try {
        // Busca saldo atualizado
        if (isAuthenticated) {
            const profileRes = await api.get('/auth/profile');
            setMyLiteBalance(profileRes.data.patinhasLite || 0);
            // Atualiza também o saldo premium global para garantir sincronia
            useUserStore.setState({ patinhas: profileRes.data.patinhasBalance });
        }

        const res = await api.get(`/chapters/${chapterId}/content`);
        
        if (res.data.pages) setPages(res.data.pages);
        setChapterTitle(res.data.title || "");
        setChapterNumber(res.data.number);
        setPrev(res.data.prev);
        setNext(res.data.next);

      } catch (err: any) {
        if (err.response?.status === 403 && err.response?.data?.chapter) {
            setIsCurrentLocked(true);
            const data = err.response.data;
            setChapterNumber(data.chapter.number);
            setPrev(data.prev);
            setNext(data.next);
            
            setTargetChapter({
                id: data.chapter.id,
                price: data.chapter.price,
                number: data.chapter.number,
                isLocked: true
            });
            // Não abre modal automático para não ser intrusivo, mostra a tela de bloqueio
        } else {
            console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPages();
  }, [chapterId, isAuthenticated]);

  // --- NAVEGAÇÃO / COMPRA ---
  const handleNav = (neighbor: NeighborChapter | null) => {
    if (!neighbor) return;

    if (neighbor.isLocked) {
      setTargetChapter(neighbor);
      setShowModal(true);
    } else {
      router.push(`/leitor/${mangaId}/${neighbor.id}`);
    }
  };

  const confirmPurchase = async (method: 'premium' | 'lite') => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!targetChapter) return;

    setProcessingPurchase(true);
    try {
      const response = await api.post(`/chapters/${targetChapter.id}/unlock`, { method });
      
      if (response.data.success) {
        // ATUALIZAÇÃO CRÍTICA DE SALDO
        // O backend agora retorna os saldos finais exatos
        if (response.data.newBalancePremium !== undefined) {
             useUserStore.setState({ patinhas: response.data.newBalancePremium });
        }
        if (response.data.newBalanceLite !== undefined) {
             setMyLiteBalance(response.data.newBalanceLite);
        }

        setShowModal(false);
        alert("Capítulo desbloqueado!");

        // Se comprou o atual (que estava bloqueado na tela), recarrega
        if (targetChapter.id === chapterId) {
            window.location.reload();
        } else {
            // Se comprou o próximo, vai pra ele
            router.push(`/leitor/${mangaId}/${targetChapter.id}`);
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Erro na compra");
    } finally {
      setProcessingPurchase(false);
    }
  };

  const handleBackToWork = () => router.push(`/obra/${mangaId}`);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-gato-purple w-10 h-10"/></div>;

  return (
    <div className="min-h-screen bg-[#111] text-white">
      
      {/* HEADER */}
      <AnimatePresence>
        {showUI && (
          <motion.header initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent h-24 flex items-center px-4 md:px-8 pointer-events-none">
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

      {/* ÁREA PRINCIPAL */}
      <div onClick={() => setShowUI(!showUI)} className="w-full max-w-4xl mx-auto flex flex-col items-center bg-black min-h-screen pb-10">
        
        {isCurrentLocked ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6 p-4 text-center">
                <div className="bg-zinc-900 p-6 rounded-full border-2 border-gato-amber/30">
                    <LockIcon className="w-12 h-12 text-gato-amber" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Capítulo Bloqueado</h2>
                    <p className="text-zinc-500 mt-2">Você precisa desbloquear para continuar lendo.</p>
                </div>
                <button 
                    onClick={() => { setTargetChapter({ id: chapterId, price: 1, isLocked: true, number: Number(chapterNumber) }); setShowModal(true); }} 
                    className="bg-gato-purple hover:bg-gato-purple/90 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-gato-purple/20 transition-all active:scale-95"
                >
                    Desbloquear Agora
                </button>
            </div>
        ) : (
            pages.map((src, index) => (
                <img key={index} src={src} alt={`Página ${index + 1}`} className="w-full h-auto block select-none" loading="lazy" style={{ display: 'block' }} />
            ))
        )}
      </div>

      {/* RODAPÉ */}
      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-12">
        <div className="py-10 text-center border-b border-white/5">
            <div className="flex flex-col md:flex-row justify-center gap-4">
              
              {/* ANTERIOR */}
              <button 
                  onClick={() => handleNav(prev)}
                  disabled={!prev} 
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border 
                    ${prev 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-white/10 cursor-pointer' 
                        : 'bg-zinc-900 text-zinc-600 border-transparent cursor-not-allowed opacity-50'
                    }`}
              >
                  {prev?.isLocked ? <LockIcon className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>} 
                  Anterior {prev?.isLocked ? "(Bloqueado)" : ""}
              </button>
              
              {/* PRÓXIMO */}
              <button 
                  onClick={() => handleNav(next)}
                  disabled={!next}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg 
                    ${next 
                        ? (next.isLocked ? 'bg-gato-amber text-black hover:brightness-110 shadow-gato-amber/20' : 'bg-gato-purple text-white hover:bg-gato-purple/80 shadow-gato-purple/20')
                        : 'bg-zinc-800 text-zinc-500 shadow-none cursor-not-allowed opacity-50'
                    }`}
              >
                  {next?.isLocked ? <LockIcon className="w-4 h-4"/> : null} 
                  {next?.isLocked ? `Desbloquear Cap ${next.number}` : `Próximo (${next?.number || ''})`} 
                  {!next?.isLocked && <ChevronRight className="w-4 h-4"/>}
              </button>
            </div>
        </div>

        {!isCurrentLocked && (
            <div className="bg-zinc-900/20 rounded-2xl border border-white/5 p-4 md:p-8">
                <div className="flex items-center gap-2 mb-6"><MessageSquare className="w-5 h-5 text-gato-purple"/><h3 className="text-xl font-bold">Comentários</h3></div>
                <CommentSection chapterId={chapterId} />
            </div>
        )}
      </div>

      {/* MODAL DE COMPRA */}
      <AnimatePresence>
        {showModal && targetChapter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !processingPurchase && setShowModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-gato-gray border border-white/10 w-full max-w-sm p-6 rounded-2xl shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gato-purple via-gato-amber to-gato-purple" />
               <h3 className="text-xl font-bold text-white text-center mb-2 mt-2">Capítulo {targetChapter.number} Bloqueado</h3>
               <p className="text-center text-gato-muted text-sm mb-6">Escolha como deseja acessar.</p>

               <div className="space-y-3">
                   <button onClick={() => confirmPurchase('premium')} disabled={processingPurchase || patinhas < targetChapter.price} className="w-full flex items-center justify-between bg-gradient-to-r from-gato-amber to-yellow-600 hover:brightness-110 disabled:opacity-50 text-black font-bold p-4 rounded-xl transition-all active:scale-95">
                        <div className="text-left"><div className="flex items-center gap-2"><Crown className="w-4 h-4" /> Acesso Vitalício</div><div className="text-[10px] opacity-80 font-normal">Nunca expira</div></div>
                        <div className="text-right"><span className="block text-sm">{targetChapter.price} 🐾</span><span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded">Saldo: {patinhas}</span></div>
                   </button>
                   
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