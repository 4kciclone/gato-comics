"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useUserStore } from "@/store/useUserStore";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Chama o backend
      const res = await api.post("/auth/login", { email, password });
      
      // Salva na store global
      const { user, token } = res.data;
      login(token, user, user.patinhasBalance || 0);

      // Redireciona
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gato-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gato-purple/20 blur-[100px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-gato-gray/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h1>
          <p className="text-gato-muted text-sm">Entre para acessar sua coleção</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
            className="w-full bg-gradient-to-r from-gato-purple to-indigo-600 hover:brightness-110 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gato-purple/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gato-muted">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-gato-purple hover:text-white font-bold transition-colors">
            Crie agora
          </Link>
        </div>
      </motion.div>
    </div>
  );
}