"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useUserStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", { fullName, email, password });
      
      // Auto login após registro
      const { user, token } = res.data;
      login(token, user, user.patinhasBalance || 5); // 5 é o bônus inicial

      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gato-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gato-amber/10 blur-[100px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-gato-gray/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Junte-se à Alcateia</h1>
          <p className="text-gato-muted text-sm">Crie sua conta e ganhe 5 patinhas grátis</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gato-muted uppercase font-bold ml-1">Nome de Caçador</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gato-muted" />
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-gato-purple focus:ring-1 focus:ring-gato-purple transition-all outline-none"
                placeholder="Sung Jin-Woo"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gato-muted uppercase font-bold ml-1">Email</label>
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

          <div className="space-y-1">
            <label className="text-xs text-gato-muted uppercase font-bold ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gato-muted" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-gato-purple focus:ring-1 focus:ring-gato-purple transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-gato-amber to-orange-500 hover:brightness-110 text-black font-bold py-3.5 rounded-xl shadow-lg shadow-gato-amber/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Criar Conta <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gato-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-gato-amber hover:text-white font-bold transition-colors">
            Entrar
          </Link>
        </div>
      </motion.div>
    </div>
  );
}