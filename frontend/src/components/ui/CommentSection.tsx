"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { CommentItem, CommentData } from "./CommentItem";
import { Send, Loader2, X } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

interface Props {
  workId?: string;
  chapterId?: string;
}

export function CommentSection({ workId, chapterId }: Props) {
  const { isAuthenticated, user } = useUserStore();
  
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado do Formulário
  const [text, setText] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Estado de Resposta
  const [replyTarget, setReplyTarget] = useState<{id: string, name: string} | null>(null);

  const fetchComments = async () => {
    try {
      // Monta query string
      const params = new URLSearchParams();
      if (workId) params.append('workId', workId);
      if (chapterId) params.append('chapterId', chapterId);

      const res = await api.get(`/comments?${params.toString()}`);
      setComments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [workId, chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert("Faça login para comentar.");
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/comments', {
        text,
        isSpoiler,
        workId,
        chapterId,
        parentId: replyTarget?.id || null
      });

      setText("");
      setIsSpoiler(false);
      setReplyTarget(null);
      fetchComments(); // Recarrega para mostrar o novo comentário (incluindo cosméticos)
    } catch (error) {
      alert("Erro ao enviar comentário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        Comentários <span className="text-zinc-600 text-sm">({comments.length})</span>
      </h3>

      {/* FORMULÁRIO */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 mb-8">
        {replyTarget && (
            <div className="flex items-center justify-between bg-gato-purple/10 px-3 py-2 rounded-lg mb-2 text-sm text-gato-purple border border-gato-purple/20">
                <span>Respondendo a <strong>{replyTarget.name}</strong></span>
                <button onClick={() => setReplyTarget(null)}><X className="w-4 h-4"/></button>
            </div>
        )}
        
        <form onSubmit={handleSubmit}>
            <textarea 
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={isAuthenticated ? "Deixe seu comentário..." : "Faça login para comentar"}
                disabled={!isAuthenticated || submitting}
                className="w-full bg-black/20 border border-white/5 rounded-lg p-3 text-white focus:border-gato-purple outline-none resize-none text-sm min-h-[80px]"
            />
            
            <div className="flex justify-between items-center mt-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 hover:text-white select-none">
                    <input 
                        type="checkbox" 
                        checked={isSpoiler} 
                        onChange={e => setIsSpoiler(e.target.checked)} 
                        className="accent-gato-purple"
                    />
                    Contém Spoiler?
                </label>

                <button 
                    type="submit" 
                    disabled={!text.trim() || submitting || !isAuthenticated}
                    className="bg-gato-purple hover:bg-gato-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Send className="w-4 h-4"/> Enviar</>}
                </button>
            </div>
        </form>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-zinc-600 mx-auto"/></div>
      ) : comments.length === 0 ? (
        <p className="text-center text-zinc-600">Seja o primeiro a comentar!</p>
      ) : (
        <div className="space-y-2">
            {comments.map(comment => (
                <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    onReply={(parentId, name) => setReplyTarget({ id: parentId, name })} 
                />
            ))}
        </div>
      )}
    </div>
  );
}