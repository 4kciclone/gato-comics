"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, ShieldCheck, Gem, Palette, Coins, ShoppingBag, Crown, Check, Ban, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, useSearchParams } from "next/navigation";
import { CosmeticRenderer } from "@/components/ui/CosmeticRenderer";

// --- TIPOS ---
interface Pack {
  id: string;
  name: string;
  patinhas: number;
  bonus: number;
  price: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  monthlyPatinhas: number;
  maxWorksSelect: number;
  storeDiscount: number;
  tier: string;
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

// 1. COMPONENTE COM A LÓGICA DA LOJA (Child)
function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, addPatinhas, patinhas } = useUserStore();
  
  // Abas: Packs, Cosmetics, Plans
  const [activeTab, setActiveTab] = useState<'packs' | 'cosmetics' | 'plans'>('packs');
  
  const [packs, setPacks] = useState<Pack[]>([]);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // --- CARREGAR DADOS ---
  useEffect(() => {
    async function fetchData() {
      try {
        // Busca Packs, Itens e Planos em paralelo
        const [packsRes, itemsRes, plansRes] = await Promise.all([
          api.get('/shop/packs'),
          api.get('/shop/items'),
          api.get('/plans')
        ]);
        setPacks(packsRes.data);
        setItems(itemsRes.data);
        setPlans(plansRes.data);
      } catch (error) {
        console.error("Erro ao carregar loja", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // --- FEEDBACK DO STRIPE ---
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

  // --- AÇÃO: COMPRAR PACOTE (STRIPE) ---
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

  // --- AÇÃO: COMPRAR COSMÉTICO (PATINHAS) ---
  const handleBuyCosmetic = async (item: ShopItem) => {
    if (!isAuthenticated) return router.push("/login");
    
    if (patinhas < item.price) {
      alert(`Você precisa de mais ${item.price - patinhas} patinhas!`);
      setActiveTab('packs'); // Leva para comprar patinhas
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

  // --- AÇÃO: ASSINAR PLANO (MOCK/FUTURO) ---
  const handleSubscribe = (plan: Plan) => {
    if (!isAuthenticated) return router.push("/login");
    // Aqui entraria a lógica de subscription do Stripe (Checkout mode=subscription)
    alert("Funcionalidade de assinatura recorrente será implementada em breve junto ao Stripe Billing.");
  };

  // Helper de Estilo dos Planos
  const getPlanStyle = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return { icon: <Zap className="w-5 h-5 text-orange-500"/>, color: 'border-orange-700/50', popular: false };
      case 'PRATA': return { icon: <Sparkles className="w-5 h-5 text-gray-300"/>, color: 'border-gray-400/50', popular: false };
      case 'OURO': return { icon: <Crown className="w-5 h-5 text-gato-amber"/>, color: 'border-gato-amber bg-gato-amber/5', popular: true };
      case 'PLATINA': return { icon: <Gem className="w-5 h-5 text-cyan-400"/>, color: 'border-cyan-400/50', popular: false };
      default: return { icon: <Zap/>, color: 'border-white/10', popular: false };
    }
  };

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-10 h-10 text-gato-amber animate-spin"/></div>;
  }

  return (
    <>
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
        <span className="inline-block px-3 py-1 bg-gato-amber/10 text-gato-amber rounded-full text-xs font-bold uppercase tracking-widest border border-gato-amber/20">
          Gato Store
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          Mercado da <span className="text-transparent bg-clip-text bg-gradient-to-r from-gato-purple to-pink-600">Alcateia</span>
        </h1>
      </div>

      {/* SELETOR DE ABAS */}
      <div className="flex justify-center mb-12">
        <div className="bg-zinc-900/80 p-1.5 rounded-2xl border border-white/10 flex gap-2 backdrop-blur-sm overflow-x-auto">
          {[
            { id: 'packs', label: 'Patinhas', icon: Coins },
            { id: 'cosmetics', label: 'Cosméticos', icon: Palette },
            { id: 'plans', label: 'Assinaturas', icon: Crown },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-gato-purple text-white shadow-lg shadow-gato-purple/20' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- ABA 1: PACOTES --- */}
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

        {/* --- ABA 2: COSMÉTICOS --- */}
        {activeTab === 'cosmetics' && (
           <motion.div key="cosmetics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="container mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {items.length === 0 && <div className="col-span-full text-center text-zinc-500 py-10">Nenhum item disponível.</div>}
              {items.map(item => (
                 <div key={item.id} className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl flex flex-col items-center hover:bg-zinc-900 transition-colors">
                    <div className="h-32 w-full flex items-center justify-center mb-4 bg-black/40 rounded-lg overflow-hidden relative border border-white/5">
                        <div className="relative flex items-center justify-center w-full h-full">
                            {item.type === 'TITLE_EFFECT' && <CosmeticRenderer type="TITLE_EFFECT" cssString={item.cssClass} className="text-xl">{item.name}</CosmeticRenderer>}
                            {item.type === 'BANNER' && <CosmeticRenderer type="BANNER" cssString={item.cssClass} previewUrl={item.previewUrl} className="absolute inset-0" />}
                            {item.type === 'FRAME' && (
                                <div className="relative w-16 h-16">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800" />
                                    <CosmeticRenderer type="FRAME" cssString={item.cssClass} previewUrl={item.previewUrl} />
                                </div>
                            )}
                        </div>
                    </div>
                    <h3 className="font-bold text-white text-sm mb-2">{item.name}</h3>
                    <button onClick={() => handleBuyCosmetic(item)} className="bg-white/10 hover:bg-gato-purple w-full py-2 rounded-lg text-xs font-bold transition-colors">
                        {buyingId === item.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto"/> : `${item.price} 🐾`}
                    </button>
                 </div>
              ))}
           </motion.div>
        )}

        {/* --- ABA 3: ASSINATURAS --- */}
        {activeTab === 'plans' && (
          <motion.div 
            key="plans"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end"
          >
            {plans.map((plan) => {
               const style = getPlanStyle(plan.tier);
               return (
                  <div key={plan.id} className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-zinc-900/60 backdrop-blur-sm ${style.color} ${style.popular ? 'h-[460px] border-2 shadow-2xl shadow-gato-amber/10' : 'h-[420px]'}`}>
                     
                     {style.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gato-amber text-black font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Recomendado</div>}

                     <div className="mb-4 flex items-center justify-between">
                        <div className="p-3 rounded-lg bg-black/30 border border-white/5">{style.icon}</div>
                        <h3 className="font-bold text-xl uppercase tracking-wider text-gato-ghost">{plan.name.replace('Caçador ', '')}</h3>
                     </div>

                     <div className="mb-6">
                        <span className="text-sm text-gato-muted">R$</span>
                        <span className="text-4xl font-extrabold text-white">{Number(plan.price).toFixed(2).split('.')[0]}</span>
                        <span className="text-lg font-bold text-white">,{Number(plan.price).toFixed(2).split('.')[1]}</span>
                        <span className="text-gato-muted text-sm"> /mês</span>
                     </div>

                     <ul className="space-y-3 mb-8 flex-1">
                        {/* ITEM NOVO: SEM ADS */}
                        <li className="flex items-center gap-3 text-sm text-gato-ghost">
                            <div className="p-0.5 bg-gato-green/10 rounded-full"><Ban className="w-3 h-3 text-gato-green shrink-0" /></div>
                            <span><strong>Sem Anúncios</strong></span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gato-ghost">
                            <Check className="w-4 h-4 text-gato-green shrink-0" />
                            <span><strong className="text-white">{plan.maxWorksSelect}</strong> Obras à escolha</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gato-ghost">
                            <Check className="w-4 h-4 text-gato-green shrink-0" />
                            <span><strong className="text-gato-amber">{plan.monthlyPatinhas}</strong> Patinhas mensais</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-gato-ghost">
                            <Check className="w-4 h-4 text-gato-green shrink-0" />
                            <span><strong>{plan.storeDiscount}%</strong> Desconto na Loja</span>
                        </li>
                     </ul>

                     <button onClick={() => handleSubscribe(plan)} className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 ${style.popular ? 'bg-gato-amber text-black hover:bg-yellow-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                        Assinar Agora
                     </button>
                  </div>
               );
            })}
          </motion.div>
        )}

      </AnimatePresence>

      <div className="mt-20 text-center text-zinc-600 text-sm flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 opacity-70">
            <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Pagamento Seguro</span>
            <span className="flex items-center gap-1"><Gem className="w-4 h-4"/> Entrega Automática</span>
        </div>
      </div>
    </>
  );
}

// 2. COMPONENTE PÁGINA (WRAPPER COM SUSPENSE)
export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gato-black pb-20 pt-24 px-4">
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-10 h-10 text-gato-amber animate-spin"/>
        </div>
      }>
        <ShopContent />
      </Suspense>
    </div>
  );
}