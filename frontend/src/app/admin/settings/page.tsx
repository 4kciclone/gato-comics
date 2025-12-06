"use client";

import React, { useState, useEffect } from "react";
import { Save, Cloud, CreditCard, Server, Globe, Loader2, Key } from "lucide-react";
import api from "@/lib/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado Inicial com TODOS os campos necessários
  const [config, setConfig] = useState({
    siteName: "",
    maintenanceMode: false,
    
    // Cloudflare R2 (Completo)
    cloudflareBucket: "",
    cloudflarePublicUrl: "",
    r2AccountId: "",
    r2AccessKey: "",
    r2SecretKey: "",

    // Stripe
    stripePublicKey: "",
    stripeSecretKey: "",
  });

  // 1. CARREGAR CONFIGURAÇÕES SALVAS
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get('/admin/settings');
        setConfig(prev => ({ ...prev, ...res.data }));
      } catch (error) {
        console.error("Erro ao carregar configs", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', config);
      alert("Configurações atualizadas com sucesso!");
    } catch (error) {
      alert("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-zinc-500">Carregando configurações...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Server className="w-6 h-6 text-gato-purple" /> Configurações do Sistema
        </h1>
        <p className="text-zinc-400 text-sm">Gerencie chaves de API e credenciais.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* BLOCO 1: GERAL */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> Geral
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Site</label>
                <input name="siteName" value={config.siteName} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-gato-purple outline-none" />
            </div>
            <div className="flex items-center gap-3 pt-6">
                <input type="checkbox" name="maintenanceMode" checked={config.maintenanceMode} onChange={handleChange} className="w-5 h-5 accent-gato-purple rounded cursor-pointer" />
                <label className="text-sm text-white font-medium">Ativar Modo Manutenção</label>
            </div>
          </div>
        </section>

        {/* BLOCO 2: CLOUDFLARE R2 (ATUALIZADO) */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl" />
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-orange-500" /> Armazenamento (Cloudflare R2)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Account ID</label>
                <input name="r2AccountId" value={config.r2AccountId} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none font-mono text-sm" placeholder="Ex: 8f9a..." />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Bucket</label>
                <input name="cloudflareBucket" value={config.cloudflareBucket} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none" placeholder="gato-comics-assets" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Access Key ID</label>
                <input name="r2AccessKey" value={config.r2AccessKey} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none font-mono text-sm" />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Secret Access Key</label>
                <input type="password" name="r2SecretKey" value={config.r2SecretKey} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none font-mono text-sm" />
            </div>
          </div>

          <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">URL Pública (CDN)</label>
              <input name="cloudflarePublicUrl" value={config.cloudflarePublicUrl} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none font-mono text-sm" placeholder="https://pub-xyz.r2.dev" />
              <p className="text-[10px] text-zinc-600 mt-1">Domínio conectado ao bucket ou subdomínio R2.dev</p>
          </div>
        </section>

        {/* BLOCO 3: STRIPE */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-500" /> Pagamentos (Stripe)
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Chave Pública (Public Key)</label>
                <input name="stripePublicKey" value={config.stripePublicKey} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none font-mono text-sm" placeholder="pk_test_..." />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Chave Secreta (Secret Key)</label>
                <input type="password" name="stripeSecretKey" value={config.stripeSecretKey} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none font-mono text-sm" placeholder="sk_test_..." />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4 pb-20">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-gato-purple hover:bg-gato-purple/90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-gato-purple/20 transition-all active:scale-95 disabled:opacity-50"
            >
                {saving ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5" /> Salvar Configurações</>}
            </button>
        </div>

      </form>
    </div>
  );
}