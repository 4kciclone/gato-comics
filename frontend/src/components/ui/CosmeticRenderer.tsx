import React from "react";

interface Props {
  type: 'BANNER' | 'FRAME' | 'TITLE_EFFECT';
  cssString?: string | null; // O JSON que vem do banco (campo cssClass)
  previewUrl?: string | null; // Fallback para imagens antigas
  children?: React.ReactNode; // Texto (para o título)
  className?: string;
}

export function CosmeticRenderer({ type, cssString, previewUrl, children, className = "" }: Props) {
  let style: React.CSSProperties = {};

  // Tenta ler o estilo gerado pela Forja
  try {
    if (cssString && cssString.trim().startsWith('{')) {
      style = JSON.parse(cssString);
    }
  } catch (e) {
    // Se falhar, ignora
  }

  // --- RENDERIZAR TÍTULO ---
  if (type === 'TITLE_EFFECT') {
    return (
      <span style={style} className={`inline-block ${className}`}>
        {children || "Exemplo"}
      </span>
    );
  }

  // --- RENDERIZAR BANNER ---
  if (type === 'BANNER') {
    // Se tiver CSS da forja, usa ele
    if (Object.keys(style).length > 0) {
        return <div style={style} className={`w-full h-full ${className}`} />;
    }
    // Se não, tenta imagem
    if (previewUrl) {
        return <img src={previewUrl} className={`w-full h-full object-cover ${className}`} alt="Banner" />;
    }
    // Fallback padrão
    return <div className={`w-full h-full bg-zinc-800 ${className}`} />;
  }

  // --- RENDERIZAR MOLDURA (FRAME) ---
  if (type === 'FRAME') {
    if (Object.keys(style).length > 0) {
        // A moldura da forja é aplicada via CSS
        return <div style={{...style, position: 'absolute', inset: -3, borderRadius: '50%', pointerEvents: 'none', zIndex: 20}} className={className} />;
    }
    if (previewUrl) {
        return <img src={previewUrl} className={`absolute inset-0 w-full h-full object-contain scale-110 z-20 pointer-events-none ${className}`} alt="Frame" />;
    }
    return null;
  }

  return null;
}