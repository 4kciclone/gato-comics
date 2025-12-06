"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";
import { 
  User, Settings, CreditCard, LogOut, 
  Palette, Shield, Crown, TrendingUp, History, Check, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CosmeticRenderer } from "@/components/ui/CosmeticRenderer"; // <--- Importe aqui

// --- TIPOS ---
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
  patinhasBalance: number;
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

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
      if (res.data.inventory) setInventory(res.data.inventory);
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

  useEffect(() => {
    if (activeTab === 'customize') {
      setLoadingInventory(true);
      api.get('/auth/inventory')
        .then(res => setInventory(res.data))
        .catch(err => console.error("Erro inventário", err))
        .finally(() => setLoadingInventory(false));
    }
  }, [activeTab]);

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
      
      {/* --- HEADER DO PERFIL --- */}
      <div className="relative h-64 w-full bg-zinc-900 border-b border-white/5 overflow-hidden">
        {/* Banner */}
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
            
            {/* Avatar + Frame */}
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

              <div className="absolute -bottom-3 -right-3 bg-black/80 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-gato-amber flex items-center gap-1 z-30">
                {profile.role === 'OWNER' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                {profile.role}
              </div>
            </div>

            {/* Texto + Efeito */}
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

            <div className="hidden md:flex gap-3 mb-2">
              <button onClick={() => setActiveTab('customize')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium transition-colors border border-white/5">
                Editar Visual
              </button>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/10 flex items-center gap-2">
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

        <div className="mt-8">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* ... CONTEÚDO VISÃO GERAL (IGUAL) ... */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-8 text-center text-zinc-500">
                    <p className="text-xl text-white mb-2">Estatísticas do Caçador</p>
                    <p>Saldo: {profile.patinhas} 🐾 | Capítulos Lidos: {profile.unlocks.length}</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* ... CONTEÚDO CARTEIRA (IGUAL) ... */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {profile.transactions.map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                          <div className="text-sm">
                              <p className="text-white font-medium">{tx.description}</p>
                              <p className="text-zinc-500 text-xs">{new Date(tx.createdAt).toLocaleString()}</p>
                          </div>
                          <span className={`font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-zinc-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- ABA CUSTOMIZAÇÃO COM RENDERER --- */}
            {activeTab === 'customize' && (
              <motion.div key="customize" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loadingInventory ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gato-purple"/></div>
                ) : inventory.length === 0 ? (
                    <div className="p-10 text-center bg-zinc-900/30 rounded-xl border border-white/5">
                        <Palette className="w-10 h-10 text-zinc-600 mx-auto mb-2"/>
                        <p className="text-zinc-400">Inventário vazio.</p>
                        <button onClick={() => router.push('/loja')} className="mt-4 text-gato-purple hover:underline text-sm">Ir para a Loja</button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        
                        {/* BANNERS */}
                        {inventory.some(i => i.item.type === 'BANNER') && (
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase text-zinc-500 mb-4">Banners</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {inventory.filter(i => i.item.type === 'BANNER').map(userItem => (
                                        <div key={userItem.id} onClick={() => handleEquip(userItem.id, 'BANNER')} className={`h-28 rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all ${userItem.isEquipped ? 'border-gato-purple shadow-lg' : 'border-zinc-800 hover:border-zinc-600'}`}>
                                            <CosmeticRenderer type="BANNER" cssString={userItem.item.cssClass} previewUrl={userItem.item.previewUrl} />
                                            {userItem.isEquipped && <div className="absolute top-2 right-2 bg-gato-purple text-white px-2 py-0.5 rounded text-[10px] font-bold"><Check className="w-3 h-3 inline"/> Equipado</div>}
                                            {equippingId === userItem.id && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MOLDURAS */}
                        {inventory.some(i => i.item.type === 'FRAME') && (
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase text-zinc-500 mb-4">Molduras</h3>
                                <div className="flex flex-wrap gap-6">
                                    {inventory.filter(i => i.item.type === 'FRAME').map(userItem => (
                                        <div key={userItem.id} onClick={() => handleEquip(userItem.id, 'FRAME')} className="relative cursor-pointer group w-20 h-20 flex items-center justify-center">
                                            {/* Preview da Moldura usando Renderer */}
                                            <div className={`absolute inset-0 rounded-full ${userItem.isEquipped ? 'ring-2 ring-gato-purple ring-offset-2 ring-offset-black' : ''}`}>
                                                <CosmeticRenderer type="FRAME" cssString={userItem.item.cssClass} previewUrl={userItem.item.previewUrl} />
                                            </div>
                                            <div className="w-14 h-14 rounded-full bg-zinc-800" />
                                            {userItem.isEquipped && <div className="absolute -top-1 -right-1 bg-gato-purple w-4 h-4 rounded-full flex items-center justify-center z-30"><Check className="w-2 h-2 text-white"/></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TÍTULOS */}
                        {inventory.some(i => i.item.type === 'TITLE_EFFECT') && (
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase text-zinc-500 mb-4">Efeitos de Título</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {inventory.filter(i => i.item.type === 'TITLE_EFFECT').map(userItem => (
                                        <div key={userItem.id} onClick={() => handleEquip(userItem.id, 'TITLE_EFFECT')} className={`p-4 rounded-xl border bg-zinc-900/50 cursor-pointer text-center transition-all ${userItem.isEquipped ? 'border-gato-purple' : 'border-white/5 hover:border-white/20'}`}>
                                            <CosmeticRenderer type="TITLE_EFFECT" cssString={userItem.item.cssClass} className="text-lg">
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