"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { 
  User, CreditCard, LogOut, 
  Palette, Shield, Crown, TrendingUp, History, Check, Loader2, Zap, PlayCircle, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CosmeticRenderer } from "@/components/ui/CosmeticRenderer";

// --- TIPOS DE DADOS ---

interface ShopItem {
  id: string;
  name: string;
  type: 'BANNER' | 'FRAME' | 'TITLE_EFFECT';
  previewUrl?: string;
  cssClass?: string;
}

interface UserItem {
  id: string;
  isEquipped: boolean;
  item: ShopItem;
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface UnlockHistory {
  id: string;
  chapter: {
    number: number;
    title: string;
    work: {
      title: string;
      coverUrl: string;
    }
  };
  createdAt: string;
}

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  patinhasBalance: number; // Saldo Premium
  patinhasLite: number;    // Saldo Grátis (Ads)
  dailyAdCount: number;    // Contador diário de anúncios
  createdAt: string;
  transactions: Transaction[];
  unlocks: UnlockHistory[];
  inventory: UserItem[]; 
}

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useUserStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'customize'>('overview');
  
  // Estado de Inventário (Carregado sob demanda na aba Customize)
  const [inventory, setInventory] = useState<UserItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  // Estado do Modal de Anúncio
  const [showAdModal, setShowAdModal] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  // --- 1. CARREGAR PERFIL GERAL ---
  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
      
      // Carrega o inventário inicial do perfil também para o Header funcionar
      if (res.data.inventory) setInventory(res.data.inventory);
      
      // Sincroniza store global
      useUserStore.setState({ patinhas: res.data.patinhasBalance });
    } catch (error) {
      logout();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // --- 2. CARREGAR INVENTÁRIO (Ao entrar na aba Customizar) ---
  useEffect(() => {
    if (activeTab === 'customize') {
      setLoadingInventory(true);
      api.get('/auth/inventory')
        .then(res => setInventory(res.data))
        .catch(err => console.error("Erro inventário", err))
        .finally(() => setLoadingInventory(false));
    }
  }, [activeTab]);

  // --- 3. LÓGICA DE ASSISTIR ANÚNCIO (PATINHAS LITE) ---
  const handleWatchAd = () => {
    if (!profile) return;
    if (profile.dailyAdCount >= 4) return alert("Limite diário atingido! Volte amanhã.");
    
    setShowAdModal(true);
    setAdProgress(0);

    // Simula anúncio de 5 segundos
    const interval = setInterval(() => {
        setAdProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                return 100;
            }
            return prev + 2; // +2% a cada 100ms
        });
    }, 100);
  };

  // Trigger quando o anúncio termina
  useEffect(() => {
    if (adProgress === 100 && showAdModal) {
        finishAd();
    }
  }, [adProgress, showAdModal]);

  const finishAd = async () => {
    try {
        const res = await api.post('/ads/watch');
        
        // Atualiza perfil localmente
        if (profile) {
            setProfile({
                ...profile,
                patinhasLite: res.data.patinhasLite,
                dailyAdCount: res.data.dailyAdCount
            });
        }
        
        // Pequeno delay para UX antes de fechar
        setTimeout(() => {
            setShowAdModal(false);
            setAdProgress(0);
            alert("Você ganhou 1 Patinha Lite!");
        }, 500); 

    } catch (error) {
        alert("Erro ao validar anúncio.");
        setShowAdModal(false);
    }
  };

  // --- 4. AÇÃO: EQUIPAR ITEM ---
  const handleEquip = async (userItemId: string, type: string) => {
    setEquippingId(userItemId);
    try {
      await api.post('/auth/inventory/equip', { userItemId });
      
      const newInventory = inventory.map(ui => {
        // Desequipa outros do mesmo tipo, equipa o selecionado
        if (ui.item.type === type) {
          return { ...ui, isEquipped: ui.id === userItemId };
        }
        return ui;
      });
      
      setInventory(newInventory);
      if (profile) setProfile({ ...profile, inventory: newInventory }); // Atualiza Header

    } catch (error) {
      alert("Erro ao equipar item.");
    } finally {
      setEquippingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Helpers para o Header
  const equippedBanner = inventory.find(i => i.isEquipped && i.item.type === 'BANNER');
  const equippedFrame = inventory.find(i => i.isEquipped && i.item.type === 'FRAME');
  const equippedTitle = inventory.find(i => i.isEquipped && i.item.type === 'TITLE_EFFECT');

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-500">Carregando Perfil...</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#050505] pb-20">
      
      {/* --- HEADER DO PERFIL DINÂMICO --- */}
      <div className="relative h-64 w-full bg-zinc-900 border-b border-white/5 overflow-hidden">
        {/* Banner Equipado */}
        {equippedBanner ? (
            <CosmeticRenderer 
                type="BANNER" 
                cssString={equippedBanner.item.cssClass} 
                previewUrl={equippedBanner.item.previewUrl} 
                className="absolute inset-0 opacity-80"
            />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-blue-900/40" />
        )}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
          <div className="flex items-end gap-6 w-full">
            
            {/* Avatar com Moldura */}
            <div className="relative -mb-12 group">
              <div className="w-32 h-32 relative flex items-center justify-center">
                 <CosmeticRenderer 
                    type="FRAME" 
                    cssString={equippedFrame?.item.cssClass} 
                    previewUrl={equippedFrame?.item.previewUrl} 
                 />
                 
                 <div className="w-28 h-28 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-900">
                    <span className="text-4xl font-bold text-white uppercase">{profile.fullName.charAt(0)}</span>
                 </div>
              </div>

              {/* Badge de Cargo */}
              <div className="absolute -bottom-3 -right-3 bg-black/80 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gato-amber flex items-center gap-1 z-30">
                {profile.role === 'OWNER' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                {profile.role}
              </div>
            </div>

            {/* Texto com Efeito */}
            <div className="flex-1 mb-2">
              <h1 className="text-3xl font-bold text-white">
                <CosmeticRenderer 
                    type="TITLE_EFFECT" 
                    cssString={equippedTitle?.item.cssClass}
                >
                    {profile.fullName}
                </CosmeticRenderer>
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                <span>{profile.email}</span>
                <span className="w-1 h-1 bg-zinc-600 rounded-full"/>
                <span className="text-gato-amber font-bold">{profile.patinhasBalance} 🐾</span>
                <span className="text-gato-green font-bold flex items-center gap-1"><Zap className="w-3 h-3"/> {profile.patinhasLite} Lite</span>
              </div>
            </div>

            {/* Botões Topo */}
            <div className="hidden md:flex gap-3 mb-2">
              <button onClick={() => setActiveTab('customize')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium transition-colors border border-white/5">
                Editar Visual
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/10 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- NAVEGAÇÃO --- */}
      <div className="container mx-auto px-4 mt-16">
        <div className="flex gap-6 border-b border-white/5">
          {[
            { id: 'overview', label: 'Visão Geral', icon: User },
            { id: 'wallet', label: 'Carteira & Bônus', icon: CreditCard },
            { id: 'customize', label: 'Customização', icon: Palette },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                activeTab === tab.id ? 'text-gato-purple' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gato-purple" />
              )}
            </button>
          ))}
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            
            {/* 1. VISÃO GERAL */}
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Stats */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase mb-4">Estatísticas</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black/20 rounded-xl">
                        <p className="text-2xl font-bold text-white">{profile.patinhasBalance}</p>
                        <p className="text-xs text-zinc-500">Patinhas</p>
                      </div>
                      <div className="p-4 bg-black/20 rounded-xl">
                        <p className="text-2xl font-bold text-white">{profile.unlocks.length}</p>
                        <p className="text-xs text-zinc-500">Lidos</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Histórico */}
                <div className="lg:col-span-2">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-gato-purple" /> Continuar Lendo
                  </h3>
                  
                  {profile.unlocks.length === 0 ? (
                    <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-8 text-center text-zinc-500">
                      Você ainda não leu nenhum capítulo.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {profile.unlocks.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 bg-zinc-900/50 border border-white/5 p-3 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer">
                          <img 
                            src={item.chapter.work.coverUrl} 
                            className="w-12 h-16 object-cover rounded shadow-sm" 
                          />
                          <div className="flex-1">
                            <h4 className="text-white font-bold text-sm">{item.chapter.work.title}</h4>
                            <p className="text-gato-purple text-xs">Capítulo {item.chapter.number}</p>
                            <p className="text-zinc-600 text-[10px] mt-1">Lido em {new Date(item.createdAt).toLocaleDateString()}</p>
                          </div>
                          <button className="px-4 py-2 bg-white/5 group-hover:bg-gato-purple group-hover:text-white rounded-lg text-xs font-bold transition-all">
                            Ler
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 2. CARTEIRA & ADS */}
            {activeTab === 'wallet' && (
              <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                
                {/* MISSÃO DIÁRIA */}
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-gato-green/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gato-green/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Zap className="w-5 h-5 text-gato-green fill-current"/> Missão Diária
                            </h3>
                            <p className="text-zinc-400 text-sm mt-1">Assista anúncios para ganhar Patinhas Lite grátis.</p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="text-xs font-bold bg-black/40 px-3 py-1 rounded-full text-zinc-300">
                                    Progresso: <span className={profile.dailyAdCount >= 4 ? "text-gato-green" : "text-white"}>{profile.dailyAdCount}/4</span>
                                </div>
                                {profile.dailyAdCount >= 4 && <span className="text-xs text-gato-green font-bold">Concluído por hoje!</span>}
                            </div>
                        </div>

                        <button 
                            onClick={handleWatchAd}
                            disabled={profile.dailyAdCount >= 4}
                            className="bg-gato-green hover:bg-gato-green/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-gato-green/20 transition-all active:scale-95"
                        >
                            <PlayCircle className="w-5 h-5" /> Assistir Anúncio (+1 Lite)
                        </button>
                    </div>
                </div>

                {/* EXTRATO */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                    <h3 className="font-bold text-white">Extrato de Transações</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {profile.transactions.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">Nenhuma transação recente.</div>
                    ) : (
                        profile.transactions.map((tx) => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                            <div className="text-sm">
                                <p className="text-white font-medium">{tx.description}</p>
                                <p className="text-zinc-500 text-xs">{new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
                            <span className={`font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-zinc-400'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                            </div>
                        ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. CUSTOMIZAÇÃO */}
            {activeTab === 'customize' && (
              <motion.div key="customize" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loadingInventory ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gato-purple"/></div>
                ) : inventory.length === 0 ? (
                    <div className="p-10 text-center bg-zinc-900/30 rounded-xl border border-white/5">
                        <Palette className="w-10 h-10 text-zinc-600 mx-auto mb-2"/>
                        <p className="text-zinc-400">Você não possui itens cosméticos.</p>
                        <button onClick={() => router.push('/loja')} className="mt-4 text-gato-purple hover:underline text-sm">Ir para a Loja</button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        
                        {/* SEÇÃO BANNERS */}
                        {inventory.some(i => i.item.type === 'BANNER') && (
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase text-zinc-500 mb-4">Banners</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {inventory.filter(i => i.item.type === 'BANNER').map(userItem => (
                                        <div key={userItem.id} onClick={() => handleEquip(userItem.id, 'BANNER')} className={`h-28 rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all group ${userItem.isEquipped ? 'border-gato-purple shadow-lg shadow-gato-purple/20' : 'border-zinc-800 hover:border-zinc-600'}`}>
                                            <CosmeticRenderer type="BANNER" cssString={userItem.item.cssClass} previewUrl={userItem.item.previewUrl} />
                                            {userItem.isEquipped && (
                                                <div className="absolute top-2 right-2 bg-gato-purple text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                                    <Check className="w-3 h-3"/> Equipado
                                                </div>
                                            )}
                                            {equippingId === userItem.id && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SEÇÃO MOLDURAS */}
                        {inventory.some(i => i.item.type === 'FRAME') && (
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase text-zinc-500 mb-4">Molduras</h3>
                                <div className="flex flex-wrap gap-6">
                                    {inventory.filter(i => i.item.type === 'FRAME').map(userItem => (
                                        <div key={userItem.id} onClick={() => handleEquip(userItem.id, 'FRAME')} className="relative cursor-pointer group">
                                            <div className="w-20 h-20 relative flex items-center justify-center">
                                                <div className={`absolute inset-0 rounded-full border-2 z-10 ${userItem.isEquipped ? 'border-gato-purple' : 'border-zinc-700 group-hover:border-zinc-500'}`} />
                                                <CosmeticRenderer type="FRAME" cssString={userItem.item.cssClass} previewUrl={userItem.item.previewUrl} />
                                                <div className="w-16 h-16 rounded-full bg-zinc-800 absolute" />
                                            </div>
                                            <p className="text-center text-[10px] mt-2 text-zinc-400">{userItem.item.name}</p>
                                            {userItem.isEquipped && <div className="absolute -top-1 -right-1 bg-gato-purple w-4 h-4 rounded-full flex items-center justify-center z-20"><Check className="w-2 h-2 text-white"/></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SEÇÃO TÍTULOS */}
                        {inventory.some(i => i.item.type === 'TITLE_EFFECT') && (
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase text-zinc-500 mb-4">Efeitos de Título</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {inventory.filter(i => i.item.type === 'TITLE_EFFECT').map(userItem => (
                                        <div key={userItem.id} onClick={() => handleEquip(userItem.id, 'TITLE_EFFECT')} className={`p-4 rounded-xl border bg-zinc-900/50 cursor-pointer text-center transition-all ${userItem.isEquipped ? 'border-gato-purple' : 'border-white/5 hover:border-white/20'}`}>
                                            <CosmeticRenderer type="TITLE_EFFECT" cssString={userItem.item.cssClass} className="text-lg font-bold">
                                                {profile.fullName.split(' ')[0]}
                                            </CosmeticRenderer>
                                            <p className="text-[10px] text-zinc-500 mt-2">{userItem.item.name}</p>
                                            {userItem.isEquipped && <div className="mt-2 text-[10px] text-gato-purple font-bold flex items-center justify-center gap-1"><Check className="w-3 h-3"/> Ativo</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* --- MODAL DE ANÚNCIO (SIMULAÇÃO) --- */}
      <AnimatePresence>
        {showAdModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center z-10">
                    <h2 className="text-2xl font-bold text-white mb-2">Assistindo Anúncio...</h2>
                    <p className="text-zinc-400 mb-8">Por favor, aguarde para receber sua recompensa.</p>
                    
                    {/* Barra de Progresso */}
                    <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden mb-4 border border-white/5">
                        <motion.div 
                            className="h-full bg-gato-green" 
                            initial={{ width: 0 }}
                            animate={{ width: `${adProgress}%` }}
                        />
                    </div>
                    <p className="text-gato-green font-mono font-bold">{adProgress}%</p>
                    
                    <button onClick={() => setShowAdModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}