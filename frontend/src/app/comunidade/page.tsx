"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { Loader2, Send, MessageCircle, Heart, Share2, AlertTriangle, X } from "lucide-react";
import { CosmeticRenderer } from "@/components/ui/CosmeticRenderer";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

// Reutilizando a tipagem de comentário que já temos
import { CommentData, CommentItem } from "@/components/ui/CommentItem"; // Certifique-se que o CommentItem exporta a interface

export default function CommunityPage() {
  const { user, isAuthenticated } = useUserStore();
  
  const [posts, setPosts] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Estado para Respostas
  const [replyTarget, setReplyTarget] = useState<{id: string, name: string} | null>(null);

  // 1. CARREGAR FEED
  const fetchFeed = async () => {
    try {
      // Chama a API pedindo type=community
      const res = await api.get('/comments?type=community');
      setPosts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // 2. PUBLICAR POST
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert("Faça login para participar da guilda!");
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/comments', {
        text,
        isSpoiler,
        workId: null,     // Nulo = Post da Comunidade
        chapterId: null,  // Nulo = Post da Comunidade
        parentId: replyTarget?.id || null
      });

      setText("");
      setIsSpoiler(false);
      setReplyTarget(null);
      fetchFeed(); // Atualiza o feed
    } catch (error) {
      alert("Erro ao publicar.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. FUNÇÃO DE RESPOSTA (Passada para o componente filho)
  const handleReply = (parentId: string, authorName: string) => {
    setReplyTarget({ id: parentId, name: authorName });
    // Rola suavemente para o topo para digitar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gato-black pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Guilda dos Caçadores</h1>
            <p className="text-zinc-400">Compartilhe teorias, memes e converse com a comunidade.</p>
        </div>

        {/* CAIXA DE POSTAGEM (Estilo Twitter) */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 mb-10 shadow-xl backdrop-blur-sm relative overflow-hidden">
            {/* Efeito de brilho se estiver respondendo */}
            {replyTarget && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gato-purple animate-pulse" />
            )}

            <div className="flex gap-4">
                {/* Avatar do Usuário Atual */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                        {user ? (
                            <span className="font-bold text-white uppercase">{user.fullName.charAt(0)}</span>
                        ) : (
                            <div className="w-full h-full bg-zinc-700 animate-pulse"/>
                        )}
                    </div>
                </div>

                <div className="flex-1">
                    {/* Aviso de Resposta */}
                    {replyTarget && (
                        <div className="flex items-center justify-between mb-2 text-xs text-gato-purple">
                            <span>Respondendo a <strong>@{replyTarget.name}</strong></span>
                            <button onClick={() => setReplyTarget(null)} className="hover:text-white"><X className="w-3 h-3"/></button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={isAuthenticated ? "O que está acontecendo no mundo dos webtoons?" : "Faça login para postar..."}
                            disabled={!isAuthenticated || submitting}
                            className="w-full bg-transparent text-white placeholder:text-zinc-500 text-lg outline-none resize-none min-h-[80px]"
                        />
                        
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <label className={`flex items-center gap-2 cursor-pointer text-xs transition-colors ${isSpoiler ? 'text-red-400' : 'text-zinc-400 hover:text-white'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={isSpoiler} 
                                        onChange={e => setIsSpoiler(e.target.checked)} 
                                        className="accent-red-500 w-4 h-4"
                                    />
                                    <AlertTriangle className="w-4 h-4" />
                                    Spoiler?
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                disabled={!text.trim() || submitting || !isAuthenticated}
                                className="bg-gato-purple hover:bg-gato-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-gato-purple/20"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Postar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        {/* FEED */}
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gato-purple"/></div>
        ) : (
            <div className="space-y-4">
                <AnimatePresence>
                    {posts.map((post) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Reutilizando o Componente de Comentário que já tem Cosméticos */}
                            <CommentItem comment={post} onReply={handleReply} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {posts.length === 0 && (
                    <div className="text-center py-20 text-zinc-600">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20"/>
                        <p>O salão da guilda está vazio. Seja o primeiro a falar!</p>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
}