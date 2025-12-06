"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Gem, Sparkles, Zap, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import api from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  price: string;
  monthlyPatinhas: number;
  maxWorksSelect: number;
  storeDiscount: number;
  tier: string;
}

export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/plans').then(res => {
      setPlans(res.data);
      setLoading(false);
    });
  }, []);

  // Helper para estilizar baseado no tier
  const getStyle = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return { icon: <Zap className="w-6 h-6 text-orange-500"/>, color: 'border-orange-700/50', popular: false };
      case 'PRATA': return { icon: <Sparkles className="w-6 h-6 text-gray-300"/>, color: 'border-gray-400/50', popular: false };
      case 'OURO': return { icon: <Crown className="w-6 h-6 text-gato-amber"/>, color: 'border-gato-amber bg-gato-amber/5', popular: true };
      case 'PLATINA': return { icon: <Gem className="w-6 h-6 text-cyan-400"/>, color: 'border-cyan-400/50', popular: false };
      default: return { icon: <Zap/>, color: 'border-white/10', popular: false };
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-600"/></div>;

  return (
    <section className="py-20 relative bg-gato-black">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gato-purple/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Escolha seu <span className="text-gato-purple">Caminho</span>
          </h2>
          <p className="text-gato-muted max-w-xl mx-auto">
            Suba de rank para desbloquear obras permanentemente e ganhar patinhas mensais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          {plans.map((plan, index) => {
            const style = getStyle(plan.tier);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={clsx(
                  "relative group flex flex-col p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 bg-gato-gray/40",
                  style.color,
                  style.popular ? "h-[460px] shadow-[0_0_40px_rgba(255,215,0,0.15)] border-2" : "h-[420px] shadow-lg"
                )}
              >
                {style.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gato-amber text-black font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse">
                    Recomendado
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                    {style.icon}
                  </div>
                  <h3 className="font-bold text-xl uppercase tracking-wider text-gato-ghost">
                    {plan.name.replace('Caçador ', '')}
                  </h3>
                </div>

                <div className="mb-6">
                  <span className="text-sm text-gato-muted">R$</span>
                  <span className="text-4xl font-extrabold text-white">{Number(plan.price).toFixed(2).split('.')[0]}</span>
                  <span className="text-lg font-bold text-white">,{Number(plan.price).toFixed(2).split('.')[1]}</span>
                  <span className="text-gato-muted text-sm"> /mês</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
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

                <button 
                  className={clsx(
                    "w-full py-3 rounded-xl font-bold transition-all active:scale-95",
                    style.popular 
                      ? "bg-gato-amber text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.3)]" 
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  )}
                >
                  Assinar Agora
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}