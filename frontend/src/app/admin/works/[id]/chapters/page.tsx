"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Save, UploadCloud, Loader2, CheckCircle, AlertCircle, Folder, Trash2 } from "lucide-react";
import JSZip from "jszip";

// Tipos
interface Chapter {
  id: string;
  number: number;
  title: string;
  price: number;
  isFree: boolean;
}

interface Work {
  id: string;
  title: string;
  coverUrl: string;
  chapters: Chapter[];
}

interface PendingChapter {
  number: string;
  title: string;
  price: number;
  pages: File[]; 
  status: 'pending' | 'uploading' | 'success' | 'error';
}

export default function WorkChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [pendingChapters, setPendingChapters] = useState<PendingChapter[]>([]);
  const [uploadingAll, setUploadingAll] = useState(false);

  const fetchWork = async () => {
    try {
      const res = await api.get(`/works/${id}`);
      setWork(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWork();
  }, [id]);

  // DELETE CHAPTER
  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Tem certeza que deseja apagar este capítulo permanentemente?")) return;
    try {
        await api.delete(`/chapters/${chapterId}`);
        fetchWork(); // Atualiza lista
    } catch (error) {
        alert("Erro ao deletar capítulo.");
    }
  };

  // ZIP PROCESSOR
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsProcessingZip(true);
    const file = e.target.files[0];
    const zip = new JSZip();
    const chapterMap = new Map<string, File[]>();

    try {
      const content = await zip.loadAsync(file);
      const entries = Object.keys(content.files);
      
      for (const filename of entries) {
        const fileData = content.files[filename];
        if (fileData.dir || filename.startsWith('__MACOSX') || filename.includes('.DS_Store')) continue;

        const parts = filename.split('/');
        if (parts.length > 1) {
          let folderName = parts[0]; 
          const numberMatch = folderName.match(/(\d+(\.\d+)?)/);
          const chapterNum = numberMatch ? numberMatch[0] : "Extras";

          const blob = await fileData.async("blob");
          const imgFile = new File([blob], parts[parts.length - 1], { type: "image/jpeg" });

          if (!chapterMap.has(chapterNum)) {
            chapterMap.set(chapterNum, []);
          }
          chapterMap.get(chapterNum)?.push(imgFile);
        }
      }

      const detectedChapters: PendingChapter[] = [];
      chapterMap.forEach((files, chapNum) => {
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        detectedChapters.push({
          number: chapNum,
          title: `Capítulo ${chapNum}`,
          price: 1, 
          pages: files,
          status: 'pending'
        });
      });

      detectedChapters.sort((a, b) => parseFloat(a.number) - parseFloat(b.number));
      setPendingChapters(detectedChapters);

    } catch (error) {
      alert("Erro ao processar o ZIP.");
    } finally {
      setIsProcessingZip(false);
      e.target.value = ""; 
    }
  };

  // UPLOAD REAL (PERSISTENTE)
  const processUploadQueue = async () => {
    setUploadingAll(true);

    for (let i = 0; i < pendingChapters.length; i++) {
      const chapter = pendingChapters[i];
      
      setPendingChapters(prev => {
        const newArr = [...prev];
        newArr[i].status = 'uploading';
        return newArr;
      });

      try {
        // 1. Upload de cada imagem para o Backend (/api/upload)
        const pageUrls = await Promise.all(chapter.pages.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            return uploadRes.data.url; // URL persistente (http://localhost:4000/uploads/...)
        }));

        // 2. Criar Capítulo com URLs Reais
        await api.post(`/works/${id}/chapters`, {
          number: chapter.number,
          title: chapter.title,
          price: chapter.price,
          pages: pageUrls 
        });

        setPendingChapters(prev => {
          const newArr = [...prev];
          newArr[i].status = 'success';
          return newArr;
        });

      } catch (error) {
        console.error(error);
        setPendingChapters(prev => {
          const newArr = [...prev];
          newArr[i].status = 'error';
          return newArr;
        });
      }
    }

    setUploadingAll(false);
    fetchWork();
    alert("Upload concluído! Capítulos disponíveis.");
  };

  if (loading) return <div className="p-10 text-center text-zinc-500">Carregando...</div>;
  if (!work) return <div className="p-10 text-center text-zinc-500">Obra não encontrada.</div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col p-6">
      
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link href="/admin/works" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div className="flex items-center gap-4">
            <img src={work.coverUrl} className="w-10 h-14 object-cover rounded shadow-sm" />
            <div>
                <h1 className="text-xl font-bold text-white">Gerenciar Capítulos</h1>
                <p className="text-zinc-400 text-xs uppercase tracking-wider">{work.title}</p>
            </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* LISTA ESQUERDA */}
        <div className="lg:col-span-1 bg-zinc-900/30 border border-white/5 rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
                <h3 className="font-bold text-zinc-300 text-sm">Capítulos Online</h3>
                <span className="bg-white/10 text-zinc-400 px-2 py-0.5 rounded text-xs">{work.chapters.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {[...work.chapters].reverse().map(cap => (
                    <div key={cap.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors group">
                        <div className="flex items-center gap-3">
                            <span className="text-gato-purple font-bold text-sm">#{cap.number}</span>
                            <span className="text-zinc-500 text-xs">{cap.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {cap.isFree ? 
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-bold">Grátis</span> :
                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold">{cap.price} 🐾</span>
                            }
                            {/* BOTÃO DE DELETAR */}
                            <button 
                                onClick={() => handleDeleteChapter(cap.id)}
                                className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                title="Deletar Capítulo"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* UPLOAD DIREITA */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-xl p-6 flex flex-col overflow-hidden">
            <div className="shrink-0 mb-6">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-gato-purple" /> Upload em Massa (ZIP)
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                    Arraste um .zip com pastas numeradas (ex: "1", "2"). 
                    As imagens serão salvas permanentemente no servidor.
                </p>

                <div className="relative group">
                    <input 
                        type="file" accept=".zip" 
                        onChange={handleZipUpload}
                        disabled={isProcessingZip || uploadingAll}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center transition-colors group-hover:border-gato-purple/50 group-hover:bg-gato-purple/5">
                        {isProcessingZip ? (
                            <div className="flex flex-col items-center">
                                <Loader2 className="w-8 h-8 text-gato-purple animate-spin mb-2" />
                                <span className="text-sm text-zinc-300">Processando ZIP...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Folder className="w-8 h-8 text-zinc-500 mb-2 group-hover:text-gato-purple" />
                                <span className="text-sm font-bold text-white">Clique ou arraste o ZIP aqui</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PREVIEW DA FILA */}
            {pendingChapters.length > 0 && (
                <div className="flex-1 flex flex-col overflow-hidden border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-white text-sm">Detectados ({pendingChapters.length})</h4>
                        <button 
                            onClick={processUploadQueue}
                            disabled={uploadingAll}
                            className="bg-gato-green hover:bg-gato-green/90 text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {uploadingAll ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                            Confirmar Upload
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {pendingChapters.map((cap, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/10 w-8 h-8 flex items-center justify-center rounded text-xs font-bold text-zinc-300">
                                        {cap.number}
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-medium">{cap.pages.length} páginas</p>
                                        <p className="text-xs text-zinc-500">Custo: {cap.price} 🐾</p>
                                    </div>
                                </div>
                                <div>
                                    {cap.status === 'pending' && <span className="text-xs text-zinc-500">Aguardando</span>}
                                    {cap.status === 'uploading' && <Loader2 className="w-4 h-4 text-gato-purple animate-spin" />}
                                    {cap.status === 'success' && <CheckCircle className="w-4 h-4 text-gato-green" />}
                                    {cap.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}