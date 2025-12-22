"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await api.post('/auth/forgot-password', { email });
        // Sempre mostramos sucesso por segurança, para não revelar quais emails existem
        setSent(true);
    } catch (error) {
        setSent(true);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gato-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeito de Fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-gato-gray/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
      >
        <Link href="/login" className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-6 transition-colors inline-flex">
            <ArrowLeft className="w-4 h-4"/> Voltar
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Recuperar Acesso</h1>
          <p className="text-gato-muted text-sm">Digite seu e-mail para receber um link de redefinição.</p>
        </div>

        {sent ? (
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                    <CheckCircle className="w-8 h-8"/>
                </div>
                <h3 className="text-white font-bold mb-2">E-mail enviado!</h3>
                <p className="text-zinc-400 text-sm">Verifique sua caixa de entrada (e spam) para redefinir sua senha.</p>
                <Link href="/login" className="text-gato-purple text-sm font-bold mt-4 inline-block hover:underline">
                    Voltar ao Login
                </Link>
            </div>
        ) : (
            <form onSubmit={handleRecover} className="space-y-6">
            <div className="space-y-1">
                <label className="text-xs text-gato-muted uppercase font-bold ml-1">Email Cadastrado</label>
                <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gato-muted" />
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-gato-purple focus:ring-1 focus:ring-gato-purple transition-all outline-none"
                    placeholder="seu@email.com"
                />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gato-purple hover:bg-gato-purple/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gato-purple/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Link"}
            </button>
            </form>
        )}
      </motion.div>
    </div>
  );
}