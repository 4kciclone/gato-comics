"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { Save, Loader2, RefreshCw, Palette, Layers, Type, Box } from "lucide-react";

export default function AdminItemsPage() {
  const [loading, setLoading] = useState(false);
  
  // Estado do Item
  const [name, setName] = useState("");
  const [price, setPrice] = useState(10);
  const [type, setType] = useState<'BANNER' | 'FRAME' | 'TITLE_EFFECT'>('TITLE_EFFECT');

  // Estado da Customização (A "Forja")
  const [config, setConfig] = useState({
    color1: "#8A2BE2",
    color2: "#FF0080",
    color3: "#FFD700",
    angle: 45,
    animationSpeed: 3,
    glowIntensity: 10,
    isAnimated: true,
    borderWidth: 3,
  });

  // --- GERADOR DE ESTILOS (CORRIGIDO) ---
  const getPreviewStyle = () => {
    const { color1, color2, color3, angle, animationSpeed, glowIntensity, borderWidth } = config;

    if (type === 'TITLE_EFFECT') {
      return {
        // CORREÇÃO: Usar backgroundImage em vez de background para não conflitar com backgroundSize
        backgroundImage: `linear-gradient(${angle}deg, ${color1}, ${color2}, ${color3}, ${color1})`,
        backgroundSize: '300% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: config.isAnimated ? `shine ${animationSpeed}s linear infinite` : 'none',
        fontWeight: '800',
        filter: `drop-shadow(0 0 ${glowIntensity}px ${color1})`
      } as React.CSSProperties;
    }

    if (type === 'BANNER') {
      return {
        backgroundImage: `linear-gradient(${angle}deg, ${color1}, ${color2}, ${color3})`,
        backgroundSize: '200% 200%',
        animation: config.isAnimated ? `gradientMove ${animationSpeed}s ease infinite` : 'none',
      } as React.CSSProperties;
    }

    if (type === 'FRAME') {
        return {
            backgroundImage: `linear-gradient(${angle}deg, ${color1}, ${color2})`,
            padding: `${borderWidth}px`,
            borderRadius: '50%',
            boxShadow: `0 0 ${glowIntensity}px ${color1}`,
            animation: config.isAnimated ? `spin ${animationSpeed * 2}s linear infinite` : 'none',
        } as React.CSSProperties;
    }

    return {};
  };

  // Salvar no Banco
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const styleObject = getPreviewStyle();
      const styleString = JSON.stringify(styleObject); 

      await api.post('/admin/items', {
        name,
        type,
        price,
        cssClass: styleString,
        isAnimated: config.isAnimated,
        previewUrl: "", 
        description: "Item gerado na Forja"
      });

      alert("Item forjado com sucesso!");
      setName("");
    } catch (err) {
      alert("Erro ao criar item");
    } finally {
      setLoading(false);
    }
  };

  // Upload de Imagem (Opcional, caso queira enviar imagem em vez de gerar CSS)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implementação opcional se quiser misturar upload com gerador
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col md:flex-row gap-8">
      
      {/* --- LADO ESQUERDO: CONTROLES --- */}
      <div className="w-full md:w-1/2 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Palette className="w-6 h-6 text-gato-purple" /> Forja de Cosméticos
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Dados Básicos */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Nome</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white" placeholder="Ex: Chama Azul" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Preço</label>
                    <input required type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-white" />
                </div>
            </div>

            {/* Seleção de Tipo */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Tipo de Item</label>
                <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setType('TITLE_EFFECT')} className={`p-2 rounded border text-sm font-bold flex flex-col items-center gap-1 ${type === 'TITLE_EFFECT' ? 'bg-gato-purple border-gato-purple text-white' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}>
                        <Type className="w-4 h-4"/> Título
                    </button>
                    <button type="button" onClick={() => setType('BANNER')} className={`p-2 rounded border text-sm font-bold flex flex-col items-center gap-1 ${type === 'BANNER' ? 'bg-gato-purple border-gato-purple text-white' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}>
                        <Layers className="w-4 h-4"/> Banner
                    </button>
                    <button type="button" onClick={() => setType('FRAME')} className={`p-2 rounded border text-sm font-bold flex flex-col items-center gap-1 ${type === 'FRAME' ? 'bg-gato-purple border-gato-purple text-white' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}>
                        <Box className="w-4 h-4"/> Moldura
                    </button>
                </div>
            </div>

            <div className="w-full h-px bg-white/5 my-4" />

            {/* Controles de Estilo */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-gato-amber" /> Personalizar Visual
                </h3>

                {/* Cores */}
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase">Cor Primária</label>
                        <div className="flex gap-2">
                            <input type="color" value={config.color1} onChange={e => setConfig({...config, color1: e.target.value})} className="h-8 w-8 bg-transparent border-none cursor-pointer" />
                            <input type="text" value={config.color1} onChange={e => setConfig({...config, color1: e.target.value})} className="w-full bg-black/20 text-xs border border-white/10 rounded px-1" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase">Cor Secundária</label>
                        <div className="flex gap-2">
                            <input type="color" value={config.color2} onChange={e => setConfig({...config, color2: e.target.value})} className="h-8 w-8 bg-transparent border-none cursor-pointer" />
                            <input type="text" value={config.color2} onChange={e => setConfig({...config, color2: e.target.value})} className="w-full bg-black/20 text-xs border border-white/10 rounded px-1" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase">Cor Terciária</label>
                        <div className="flex gap-2">
                            <input type="color" value={config.color3} onChange={e => setConfig({...config, color3: e.target.value})} className="h-8 w-8 bg-transparent border-none cursor-pointer" />
                            <input type="text" value={config.color3} onChange={e => setConfig({...config, color3: e.target.value})} className="w-full bg-black/20 text-xs border border-white/10 rounded px-1" />
                        </div>
                    </div>
                </div>

                {/* Sliders */}
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-zinc-400 flex justify-between">
                            Ângulo do Gradiente <span>{config.angle}°</span>
                        </label>
                        <input type="range" min="0" max="360" value={config.angle} onChange={e => setConfig({...config, angle: Number(e.target.value)})} className="w-full accent-gato-purple" />
                    </div>
                    
                    {type !== 'BANNER' && (
                        <div>
                            <label className="text-xs text-zinc-400 flex justify-between">
                                Intensidade do Brilho (Glow) <span>{config.glowIntensity}px</span>
                            </label>
                            <input type="range" min="0" max="50" value={config.glowIntensity} onChange={e => setConfig({...config, glowIntensity: Number(e.target.value)})} className="w-full accent-gato-purple" />
                        </div>
                    )}

                    {type === 'FRAME' && (
                        <div>
                            <label className="text-xs text-zinc-400 flex justify-between">
                                Espessura da Borda <span>{config.borderWidth}px</span>
                            </label>
                            <input type="range" min="1" max="10" value={config.borderWidth} onChange={e => setConfig({...config, borderWidth: Number(e.target.value)})} className="w-full accent-gato-purple" />
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-zinc-400 flex justify-between">
                            Velocidade da Animação <span>{config.animationSpeed}s</span>
                        </label>
                        <input type="range" min="0.5" max="10" step="0.5" value={config.animationSpeed} onChange={e => setConfig({...config, animationSpeed: Number(e.target.value)})} className="w-full accent-gato-purple" />
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
                    <input type="checkbox" checked={config.isAnimated} onChange={e => setConfig({...config, isAnimated: e.target.checked})} className="accent-gato-purple" />
                    <label className="text-sm text-white">Ativar Animação</label>
                </div>

            </div>

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-gato-purple to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-gato-purple/20 transition-all hover:scale-[1.02] flex justify-center gap-2">
                {loading ? <Loader2 className="animate-spin"/> : <><Save className="w-5 h-5" /> Criar Item</>}
            </button>
        </form>
      </div>

      {/* --- LADO DIREITO: PREVIEW --- */}
      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white">Preview ao Vivo</h2>
        
        {/* Card de Simulação */}
        <div className="bg-[#050505] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[400px]">
            
            {/* Área do Banner */}
            <div className="h-40 w-full bg-zinc-800 relative">
                {type === 'BANNER' ? (
                    <div style={getPreviewStyle()} className="absolute inset-0 w-full h-full" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900" />
                )}
            </div>

            <div className="px-6 relative z-10 -mt-16">
                <div className="flex items-end gap-4">
                    
                    {/* Área do Avatar/Moldura */}
                    <div className="relative">
                        {type === 'FRAME' && (
                            <div className="absolute inset-[-4px] rounded-full pointer-events-none z-20" style={getPreviewStyle()}></div>
                        )}
                        <div className="w-32 h-32 rounded-full bg-zinc-900 border-4 border-[#050505] flex items-center justify-center relative z-10 overflow-hidden">
                            <span className="text-4xl font-bold text-zinc-700">U</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        {/* Área do Título */}
                        {type === 'TITLE_EFFECT' ? (
                            <h1 style={getPreviewStyle()} className="text-3xl font-bold">
                                {name || "Seu Nome Aqui"}
                            </h1>
                        ) : (
                            <h1 className="text-3xl font-bold text-white">Seu Nome Aqui</h1>
                        )}
                        <p className="text-zinc-500 text-sm">Membro Lendário</p>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="h-4 w-3/4 bg-zinc-900 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-zinc-900 rounded animate-pulse" />
                </div>
            </div>

        </div>

        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 text-xs text-zinc-500">
            <p>O estilo gerado é CSS puro. Ele é leve e roda suave em qualquer dispositivo.</p>
        </div>
      </div>

    </div>
  );
}