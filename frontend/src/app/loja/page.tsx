"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, ShieldCheck, Gem, Palette, Coins, ShoppingBag } from "lucide-react";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, useSearchParams } from "next/navigation";
import { CosmeticRenderer } from "@/components/ui/CosmeticRenderer"; // <--- Importe aqui

// --- TIPOS ---
interface Pack {
  id: string;
  name: string;
  patinhas: number;
  bonus: number;
  price: string;
}

interface ShopItem {
  id: string;
  name: string;
  type: 'BANNER' | 'FRAME' | 'TITLE_EFFECT';
  price: number;
  previewUrl?: string;
  cssClass?: string;
  description?: string;
}

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, addPatinhas, patinhas } = useUserStore();
  
  const [activeTab, setActiveTab] = useState<'packs' | 'cosmetics'>('packs');
  const [packs, setPacks] = useState<Pack[]>([]);
  const [cosmetics, setCosmetics] = useState<ShopItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [packsRes, itemsRes] = await Promise.all([
          api.get('/shop/packs'),
          api.get('/shop/items')
        ]);
        setPacks(packsRes.data);
        setCosmetics(itemsRes.data);
      } catch (error) {
        console.error("Erro ao carregar loja", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (searchParams.get("success")) {
      alert("Pagamento confirmado! Suas patinhas foram adicionadas.");
      router.replace("/loja");
    }
    if (searchParams.get("canceled")) {
      alert("Compra cancelada.");
      router.replace("/loja");
    }
  }, [searchParams, router]);

  const handleBuyPack = async (pack: Pack) => {
    if (!isAuthenticated) return router.push("/login");
    setBuyingId(pack.id);

    try {
      const res = await api.post('/shop/checkout', { packId: pack.id });
      if (res.data.url) window.location.href = res.data.url;
      else throw new Error("Link não gerado");
    } catch (error) {
      alert("Erro ao conectar com pagamento.");
      setBuyingId(null);
    }
  };

  const handleBuyCosmetic = async (item: ShopItem) => {
    if (!isAuthenticated) return router.push("/login");
    
    if (patinhas < item.price) {
      alert(`Você precisa de mais ${item.price - patinhas} patinhas!`);
      setActiveTab('packs');
      return;
    }

    if (!confirm(`Deseja comprar "${item.name}" por ${item.price} patinhas?`)) return;

    setBuyingId(item.id);
    try {
      const res = await api.post('/shop/items/buy', { itemId: item.id });
      
      if (res.data.success) {
        addPatinhas(-(item.price));
        alert(`Você comprou: ${item.name}! Vá ao seu perfil para equipar.`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro na compra");
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gato-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-gato-amber animate-spin"/></div>;
  }

  return (
    <div className="min-h-screen bg-gato-black pb-20 pt-24 px-4">
      
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
        <span className="inline-block px-3 py-1 bg-gato-amber/10 text-gato-amber rounded-full text-xs font-bold uppercase tracking-widest border border-gato-amber/20">
          Gato Store
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          Mercado da <span className="text-transparent bg-clip-text bg-gradient-to-r from-gato-purple to-pink-600">Alcateia</span>
        </h1>
      </div>

      <div className="flex justify-center mb-12">
        <div className="bg-zinc-900/80 p-1.5 rounded-2xl border border-white/10 flex gap-2 backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('packs')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'packs' ? 'bg-gato-amber text-black shadow-lg shadow-gato-amber/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins className="w-4 h-4" /> Patinhas
          </button>
          <button 
            onClick={() => setActiveTab('cosmetics')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'cosmetics' ? 'bg-gato-purple text-white shadow-lg shadow-gato-purple/20' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4" /> Cosméticos
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {activeTab === 'packs' && (
          <motion.div 
            key="packs"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
          >
            {packs.map((pack, index) => {
              const isPopular = index === 2;
              const isUltimate = index === packs.length - 1;

              return (
                <div key={pack.id} className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 group ${
                  isPopular ? "bg-gato-amber/10 border-gato-amber shadow-[0_0_30px_rgba(255,215,0,0.15)] scale-105 z-10" : "bg-zinc-900/50 border-white/5 hover:border-white/20 hover:bg-zinc-900"
                }`}>
                  {isPopular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gato-amber text-black font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Mais Popular</div>}
                  {isUltimate && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Lendário</div>}

                  <div className="mb-6 flex justify-center text-4xl">{index === 0 ? "🥉" : index === 1 ? "🥈" : index === 2 ? "🥇" : "💎"}</div>

                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">{pack.name}</h3>
                    <div className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gato-amber">
                      {pack.patinhas} <span className="text-sm font-normal text-zinc-500 mt-2">un.</span>
                    </div>
                    {pack.bonus > 0 && <p className="text-sm text-green-400 font-bold mt-1">+ {pack.bonus} Bônus</p>}
                  </div>

                  <div className="flex-1" />

                  <button
                    onClick={() => handleBuyPack(pack)}
                    disabled={!!buyingId}
                    className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2
                      ${isPopular ? "bg-gato-amber text-black hover:bg-yellow-400" : "bg-white/10 text-white hover:bg-white/20"}
                      ${buyingId ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    {buyingId === pack.id ? <Loader2 className="w-5 h-5 animate-spin"/> : `R$ ${Number(pack.price).toFixed(2).replace('.', ',')}`}
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'cosmetics' && (
          <motion.div 
            key="cosmetics"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="container mx-auto"
          >
            {cosmetics.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">Nenhum item cosmético disponível ainda.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {cosmetics.map((item) => (
                  <div key={item.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex flex-col items-center hover:bg-zinc-900 transition-colors">
                    
                    {/* Visualização do Item */}
                    <div className="h-32 w-full flex items-center justify-center mb-4 bg-black/40 rounded-lg overflow-hidden relative border border-white/5">
                        <div className="relative flex items-center justify-center">
                            {/* Renderizador de Cosmético para Preview */}
                            {item.type === 'FRAME' && (
                                <div className="relative w-16 h-16">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800" />
                                    <CosmeticRenderer type="FRAME" cssString={item.cssClass} previewUrl={item.previewUrl} />
                                </div>
                            )}
                            {item.type === 'TITLE_EFFECT' && (
                                <CosmeticRenderer type="TITLE_EFFECT" cssString={item.cssClass} className="text-xl">
                                    {item.name}
                                </CosmeticRenderer>
                            )}
                            {item.type === 'BANNER' && (
                                <CosmeticRenderer type="BANNER" cssString={item.cssClass} previewUrl={item.previewUrl} className="absolute inset-0" />
                            )}
                        </div>
                    </div>

                    <div className="text-center w-full mb-3">
                        <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.type}</p>
                    </div>

                    <button 
                        onClick={() => handleBuyCosmetic(item)}
                        disabled={!!buyingId}
                        className="bg-white/5 hover:bg-gato-purple hover:text-white border border-white/10 w-full py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 group"
                    >
                        {buyingId === item.id ? <Loader2 className="w-3 h-3 animate-spin"/> : (
                            <>
                                <ShoppingBag className="w-3 h-3 group-hover:fill-current"/> 
                                {item.price} <span className="opacity-50">🐾</span>
                            </>
                        )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      <div className="mt-20 text-center text-zinc-600 text-sm flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 opacity-70">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Pagamento Seguro</span>
            <span className="flex items-center gap-1"><Gem className="w-4 h-4"/> Entrega Automática</span>
        </div>
      </div>
    </div>
  );
}