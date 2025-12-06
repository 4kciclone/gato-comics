"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { 
  User, CreditCard, LogOut, 
  Palette, Shield, Crown, TrendingUp, History, Check, Loader2 
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
  patinhasBalance: number; // O nome correto é este
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
  
  const [inventory, setInventory] = useState<UserItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  // 1. CARREGAR PERFIL GERAL
  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
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

  // 2. CARREGAR INVENTÁRIO (Ao entrar na aba Customizar)
  useEffect(() => {
    if (activeTab === 'customize') {
      setLoadingInventory(true);
      api.get('/auth/inventory')
        .then(res => setInventory(res.data))
        .catch(err => console.error("Erro inventário", err))
        .finally(() => setLoadingInventory(false));
    }
  }, [activeTab]);

  // 3. AÇÃO: EQUIPAR ITEM
  const handleEquip = async (userItemId: string, type: string) => {
    setEquippingId(userItemId);
    try {
      await api.post('/auth/inventory/equip', { userItemId });
      
      const newInventory = inventory.map(ui => {
        if (ui.item.type === type) {
          return { ...ui, isEquipped: ui.id === userItemId };
        }
        return ui;
      });
      
      setInventory(newInventory);
      if (profile) setProfile({ ...profile, inventory: newInventory });

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

  const equippedBanner = inventory.find(i => i.isEquipped && i.item.type === 'BANNER');
  const equippedFrame = inventory.find(i => i.isEquipped && i.item.type === 'FRAME');
  const equippedTitle = inventory.find(i => i.isEquipped && i.item.type === 'TITLE_EFFECT');

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-500">Carregando Perfil...</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#050505] pb-20">
      
      {/* --- HEADER DO PERFIL DINÂMICO --- */}
      <div className="relative h-64 w-full bg-zinc-900 border-b border-white/5 overflow-hidden">
        {/* Banner Equipado ou Padrão */}
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
        
        {/* Container Info */}
        <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
          <div className="flex items-end gap-6 w-full">
            
            {/* Avatar com Moldura */}
            <div className="relative -mb-12 group">
              <div className="w-32 h-32 relative flex items-center justify-center">
                 {/* Moldura */}
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
              <p className="text-zinc-400 text-sm flex items-center gap-2">
                {profile.email} • Membro desde {new Date(profile.createdAt).getFullYear()}
              </p>
            </div>

            {/* Ações Topo */}
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

      {/* --- NAVEGAÇÃO (TABS) --- */}
      <div className="container mx-auto px-4 mt-16">
        <div className="flex gap-6 border-b border-white/5">
          {[
            { id: 'overview', label: 'Visão Geral', icon: User },
            { id: 'wallet', label: 'Carteira & Histórico', icon: CreditCard },
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

        {/* --- CONTEÚDO DAS ABAS --- */}
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
                        {/* CORREÇÃO AQUI: patinhasBalance */}
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

                {/* Histórico de Leitura */}
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

            {/* 2. CARTEIRA */}
            {activeTab === 'wallet' && (
              <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                    <div>
                      <h3 className="font-bold text-white">Extrato de Patinhas</h3>
                      <p className="text-xs text-zinc-500">Seu histórico financeiro completo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Saldo Atual</p>
                      {/* CORREÇÃO AQUI: patinhasBalance */}
                      <p className="text-xl font-bold text-gato-amber">{profile.patinhasBalance} 🐾</p>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-white/5">
                    {profile.transactions.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500">Nenhuma transação encontrada.</div>
                    ) : (
                      profile.transactions.map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {tx.amount > 0 ? <TrendingUp className="w-4 h-4" /> : <LogOut className="w-4 h-4 rotate-180" />}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{tx.description}</p>
                              <p className="text-zinc-500 text-xs">{new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
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
    </div>
  );
}