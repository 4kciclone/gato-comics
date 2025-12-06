"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  DollarSign, TrendingUp, CreditCard, 
  ArrowDownLeft, ArrowUpRight, Activity, Calendar 
} from "lucide-react";
import { motion } from "framer-motion";

interface Transaction {
  id: string;
  type: 'PURCHASE_PACK' | 'SPENT_CHAPTER' | 'SUBSCRIPTION_BONUS' | 'ADMIN_ADJUSTMENT';
  amount: number;
  description: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    volumePatinhas: 0,
    activeSpenders: 0
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const res = await api.get('/admin/finance');
      const data = res.data.transactions as Transaction[];
      setTransactions(data);

      // Calcular Métricas Simples (No futuro, o backend faria isso)
      const sales = data.filter(t => t.type === 'PURCHASE_PACK');
      const volume = sales.reduce((acc, curr) => acc + curr.amount, 0);
      const uniqueSpenders = new Set(data.map(t => t.user.email)).size;

      setMetrics({
        totalSales: sales.length,
        volumePatinhas: volume,
        activeSpenders: uniqueSpenders
      });

    } catch (error) {
      console.error("Erro financeiro", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-gato-green" /> Fluxo Financeiro
          </h1>
          <p className="text-zinc-400 text-sm">Auditoria de transações e vendas de patinhas.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg text-xs text-zinc-400">
            <Calendar className="w-4 h-4" /> Últimos 30 dias
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Volume de Vendas */}
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gato-green/10 rounded-full blur-2xl group-hover:bg-gato-green/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gato-green/10 rounded-lg text-gato-green">
                    <CreditCard className="w-6 h-6" />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-gato-green bg-gato-green/10 px-2 py-1 rounded-full">
                    +12% <TrendingUp className="w-3 h-3" />
                </span>
            </div>
            <p className="text-zinc-400 text-sm font-medium">Patinhas Vendidas</p>
            <h3 className="text-3xl font-bold text-white mt-1">{metrics.volumePatinhas} 🐾</h3>
        </div>

        {/* Card 2: Transações Totais */}
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                    <Activity className="w-6 h-6" />
                </div>
            </div>
            <p className="text-zinc-400 text-sm font-medium">Transações Registradas</p>
            <h3 className="text-3xl font-bold text-white mt-1">{transactions.length}</h3>
        </div>

        {/* Card 3: Usuários Ativos */}
        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                    <DollarSign className="w-6 h-6" />
                </div>
            </div>
            <p className="text-zinc-400 text-sm font-medium">Compradores Únicos</p>
            <h3 className="text-3xl font-bold text-white mt-1">{metrics.activeSpenders}</h3>
        </div>
      </div>

      {/* TABELA DE TRANSAÇÕES */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white">Histórico Recente</h3>
            <button className="text-xs text-gato-purple hover:underline">Exportar CSV</button>
        </div>

        {loading ? (
            <div className="p-10 text-center text-zinc-500 animate-pulse">Carregando dados financeiros...</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-950/50 text-zinc-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Descrição</th>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Valor</th>
                            <th className="px-6 py-4 text-right">Data</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                    {tx.type === 'PURCHASE_PACK' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                            <ArrowDownLeft className="w-3 h-3" /> Compra
                                        </span>
                                    )}
                                    {tx.type === 'SPENT_CHAPTER' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                            <ArrowUpRight className="w-3 h-3" /> Consumo
                                        </span>
                                    )}
                                    {tx.type === 'ADMIN_ADJUSTMENT' && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                            Ajuste
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium text-zinc-300">
                                    {tx.description}
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    <div className="text-white text-xs font-bold">{tx.user.fullName}</div>
                                    <div className="text-[10px]">{tx.user.email}</div>
                                </td>
                                <td className={`px-6 py-4 font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount} 🐾
                                </td>
                                <td className="px-6 py-4 text-right text-zinc-500 text-xs">
                                    {new Date(tx.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}