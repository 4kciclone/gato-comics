"use client";

import React, { useState } from "react";
import { User as UserIcon, MessageSquare, AlertTriangle, CornerDownRight } from "lucide-react";
import { CosmeticRenderer } from "./CosmeticRenderer";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipagem complexa vinda do Prisma Include
export interface CommentData {
  id: string;
  text: string;
  isSpoiler: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    role: string;
    inventory: {
      item: {
        type: 'BANNER' | 'FRAME' | 'TITLE_EFFECT';
        previewUrl?: string;
        cssClass?: string;
      }
    }[];
  };
  replies?: CommentData[];
}

interface Props {
  comment: CommentData;
  onReply: (parentId: string, authorName: string) => void;
}

export function CommentItem({ comment, onReply }: Props) {
  const [showSpoiler, setShowSpoiler] = useState(!comment.isSpoiler);
  const [showReplies, setShowReplies] = useState(false);

  // Extrair cosméticos do usuário
  const banner = comment.user.inventory.find(i => i.item.type === 'BANNER')?.item;
  const frame = comment.user.inventory.find(i => i.item.type === 'FRAME')?.item;
  const titleEffect = comment.user.inventory.find(i => i.item.type === 'TITLE_EFFECT')?.item;

  return (
    <div className="mb-4">
      {/* CARD DO COMENTÁRIO */}
      <div className={`relative rounded-xl overflow-hidden border transition-all ${banner ? 'border-transparent' : 'bg-zinc-900/50 border-white/5'}`}>
        
        {/* 1. BANNER DE FUNDO (Se equipado) */}
        {banner && (
          <div className="absolute inset-0 z-0">
             <CosmeticRenderer type="BANNER" cssString={banner.cssClass} previewUrl={banner.previewUrl} className="opacity-40" />
             {/* Overlay para garantir leitura do texto */}
             <div className="absolute inset-0 bg-black/60" />
          </div>
        )}

        <div className="relative z-10 p-4 flex gap-4">
          
          {/* 2. AVATAR COM MOLDURA */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 relative flex items-center justify-center">
                {frame && (
                    <CosmeticRenderer type="FRAME" cssString={frame.cssClass} previewUrl={frame.previewUrl} className="scale-125" />
                )}
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                    <span className="font-bold text-white uppercase">{comment.user.fullName.charAt(0)}</span>
                </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: Nome + Data */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    {/* 3. TÍTULO COLORIDO */}
                    <span className={`text-sm font-bold text-white ${!titleEffect ? 'text-zinc-200' : ''}`}>
                        {titleEffect ? (
                            <CosmeticRenderer type="TITLE_EFFECT" cssString={titleEffect.cssClass}>
                                {comment.user.fullName}
                            </CosmeticRenderer>
                        ) : comment.user.fullName}
                    </span>
                    
                    {/* Badge de Cargo */}
                    {comment.user.role !== 'USER' && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-gato-purple/20 text-gato-purple rounded border border-gato-purple/30 font-bold uppercase">
                            {comment.user.role}
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-zinc-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
                </span>
            </div>

            {/* Conteúdo com Spoiler */}
            <div className="text-sm text-zinc-300 leading-relaxed break-words">
                {comment.isSpoiler && !showSpoiler ? (
                    <button 
                        onClick={() => setShowSpoiler(true)}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold w-full hover:bg-red-500/20 transition-colors"
                    >
                        <AlertTriangle className="w-4 h-4" /> Conteúdo com Spoiler (Clique para ver)
                    </button>
                ) : (
                    <p className={comment.isSpoiler ? "text-red-300/90" : ""}>{comment.text}</p>
                )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-4 mt-3">
                <button 
                    onClick={() => onReply(comment.id, comment.user.fullName)}
                    className="text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                >
                    <MessageSquare className="w-3 h-3" /> Responder
                </button>
                
                {comment.replies && comment.replies.length > 0 && (
                    <button 
                        onClick={() => setShowReplies(!showReplies)}
                        className="text-xs text-gato-purple hover:text-white font-bold flex items-center gap-1 transition-colors"
                    >
                        {showReplies ? 'Ocultar' : `Ver ${comment.replies.length}`} respostas
                    </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE RESPOSTAS (Nested) */}
      {showReplies && comment.replies && (
        <div className="ml-8 border-l-2 border-white/5 pl-4 mt-2 space-y-2">
            {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} onReply={onReply} />
            ))}
        </div>
      )}
    </div>
  );
}