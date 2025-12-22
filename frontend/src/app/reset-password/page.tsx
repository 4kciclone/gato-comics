"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        alert("As senhas não coincidem!");
        return;
    }
    
    setLoading(true);
    try {
        await api.post('/auth/reset-password', { token, newPassword: password });
        setStatus('success');
        setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || "Token inválido ou expirado.");
    } finally {
        setLoading(false);
    }
  };

  if (!token) return <div className="text-white text-center p-10">Token inválido.</div>;

  return (
    <div className="min-h-screen bg-gato-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-gato-gray/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Criar Nova Senha</h1>
          <p className="text-gato-muted text-sm">Digite sua nova senha abaixo.</p>
        </div>

        {status === 'success' ? (
             <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4"/>
                <p className="text-white font-bold">Senha alterada com sucesso!</p>
                <p className="text-zinc-500 text-sm mt-2">Redirecionando para login...</p>
             </div>
        ) : (
            <form onSubmit={handleReset} className="space-y-6">
                {status === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-sm text-center">
                        {errorMsg}
                    </div>
                )}
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gato-muted uppercase font-bold ml-1">Nova Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gato-muted" />
                            <input 
                                type="password" required minLength={6}
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-gato-purple outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gato-muted uppercase font-bold ml-1">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gato-muted" />
                            <input 
                                type="password" required minLength={6}
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-gato-purple outline-none"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" disabled={loading}
                    className="w-full bg-gato-purple hover:bg-gato-purple/90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex justify-center"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Redefinir Senha"}
                </button>
            </form>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <ResetContent />
        </Suspense>
    )
}