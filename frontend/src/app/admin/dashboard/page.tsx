"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import api from "@/lib/api";
import { DollarSign, Users, BookOpen, Lock, ArrowUpRight, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link"; // <--- Importante para navegação

interface DashboardStats {
  worksCount: number;
  usersCount: number;
  unlocksCount: number;
  totalRevenue: number;
  newUsers24h: number;
}

export default function DashboardPage() {
  const { user } = useUserStore();
  const role = user?.role || 'USER';
  const canSeeFinance = ['ADMIN', 'OWNER'].includes(role);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    {
      label: "Obras no Catálogo",
      value: stats?.worksCount || 0,
      change: "Total ativo",
      icon: BookOpen,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      show: true,
    },
    {
      label: "Capítulos Desbloqueados",
      value: stats?.unlocksCount || 0,
      change: "Leituras totais",
      icon: Lock,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
      show: true,
    },
    {
      label: "Usuários Totais",
      value: stats?.usersCount || 0,
      change: `+${stats?.newUsers24h || 0} nas últimas 24h`,
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      show: canSeeFinance,
    },
    {
      label: "Receita de Patinhas",
      value: stats?.totalRevenue || 0,
      change: "Total circulando",
      icon: DollarSign,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      show: canSeeFinance,
      isMoney: true
    },
  ];

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-zinc-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-gato-purple" />
        <p>Calculando métricas da plataforma...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Olá, <span className="text-gato-purple">{user?.fullName}</span>.
        </h1>
        <p className="text-zinc-400">Visão em tempo real do ecossistema Gato Comics.</p>
      </div>

      {/* Grid de Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
            if (!card.show) return null;
            
            return (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-6 rounded-2xl border ${card.border} bg-zinc-900/50 backdrop-blur-md relative overflow-hidden group`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.bg} ${card.color} flex items-center gap-1`}>
                            {card.change} <TrendingUp className="w-3 h-3" />
                        </span>
                    </div>
                    <h3 className="text-zinc-400 text-sm font-medium">{card.label}</h3>
                    <p className="text-3xl font-bold text-white mt-1">
                        {card.isMoney ? (
                            <span>{card.value} <span className="text-sm text-zinc-500">🐾</span></span>
                        ) : card.value}
                    </p>
                    <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${card.bg} rounded-full blur-[50px] opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                </motion.div>
            );
        })}
      </div>

      {/* Áreas de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-96">
        
        {/* Gráfico Visual */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-gato-purple" /> 
                {canSeeFinance ? "Tendência de Receita" : "Atividade de Leitura"}
            </h3>
            
            <div className="flex items-end justify-between h-64 gap-2 px-4">
                {[30, 45, 35, 60, 50, 75, 65, 90, 70, 85, 60, 95].map((h, i) => (
                    <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 1 }}
                        className="w-full bg-gradient-to-t from-gato-purple/20 to-gato-purple rounded-t-sm relative group"
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gato-purple shadow-[0_0_10px_#8A2BE2]" />
                    </motion.div>
                ))}
            </div>
            <p className="text-xs text-zinc-600 text-center mt-2">Dados de tendência baseados nos últimos 12 meses (Simulação Visual)</p>
        </div>

        {/* --- LISTA LATERAL: BOTÕES AGORA FUNCIONAIS --- */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Acesso Rápido</h3>
            <div className="space-y-3">
                
                <Link href="/admin/works" className="block">
                    <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-300 transition-colors flex items-center justify-between group">
                        Gerenciar Obras
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </button>
                </Link>

                {canSeeFinance && (
                    <Link href="/admin/users" className="block">
                        <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-300 transition-colors flex items-center justify-between group">
                            Ver Usuários Recentes
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </button>
                    </Link>
                )}

                {/* Apontando para a Forja de Cosméticos */}
                <Link href="/admin/items" className="block">
                    <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-300 transition-colors flex items-center justify-between group">
                        Criar Item da Loja
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </button>
                </Link>

                {canSeeFinance && (
                    <Link href="/admin/finance" className="block">
                        <button className="w-full text-left p-3 bg-gato-green/10 hover:bg-gato-green/20 text-gato-green rounded-lg text-sm transition-colors flex items-center justify-between group font-bold">
                            Auditoria Financeira
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </button>
                    </Link>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}