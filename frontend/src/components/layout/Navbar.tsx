"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// CORREÇÃO: Adicionado 'Users' na lista de importações abaixo
import { Search, ShoppingBag, Menu, PawPrint, LogOut, User as UserIcon, ShieldCheck, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";

export function Navbar() {
  const router = useRouter();
  
  const { patinhas, addPatinhas, isAuthenticated, user, logout } = useUserStore();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = e.currentTarget.value;
      if (term.trim()) {
        router.push(`/busca?q=${encodeURIComponent(term)}`);
      }
    }
  };

  const isAdminOrUploader = user && ['ADMIN', 'OWNER', 'UPLOADER'].includes(user.role);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/5 bg-gradient-to-b from-black/90 to-black/40 backdrop-blur-md transition-all"
    >
      <div className="container mx-auto h-full flex items-center justify-between px-4 md:px-6">
        
        {/* --- LADO ESQUERDO: LOGO E LINKS --- */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group z-50">
            <div className="relative">
              <PawPrint className="w-7 h-7 text-gato-purple group-hover:text-gato-amber transition-colors duration-300" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">
              GATO <span className="text-gato-purple">COMICS</span>
            </span>
          </Link>

          {/* LINK DA COMUNIDADE (NOVO) */}
          <Link href="/comunidade" className="hidden lg:flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors">
             <Users className="w-4 h-4" /> Comunidade
          </Link>
        </div>

        {/* --- CENTRO: BUSCA (Oculto no Mobile) --- */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gato-muted group-focus-within:text-gato-purple transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Qual mundo você quer caçar hoje?"
            onKeyDown={handleSearch}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/5 focus:border-gato-purple/50 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gato-purple/50 transition-all placeholder:text-gray-500"
          />
        </div>

        {/* --- LADO DIREITO: HUD DO USUÁRIO --- */}
        <div className="flex items-center gap-4 md:gap-6 z-50">
          
          {mounted && isAuthenticated ? (
            <>
              {/* Saldo / Link Loja */}
              <Link href="/loja">
                <div 
                  className="hidden md:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-gato-amber/30 hover:border-gato-amber/60 hover:bg-gato-amber/10 shadow-[0_0_10px_rgba(255,215,0,0.05)] hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all cursor-pointer group active:scale-95"
                  title="Ir para a Loja"
                >
                  <PawPrint className="w-3.5 h-3.5 text-gato-amber group-hover:rotate-12 transition-transform" />
                  <span className="text-sm font-bold text-gato-amber">
                    {patinhas}
                  </span>
                </div>
              </Link>

              {/* Botão Loja (Icone) */}
              <Link href="/loja">
                <button className="relative text-gato-muted hover:text-white transition-colors p-1 mt-1">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-gato-purple rounded-full animate-pulse shadow-[0_0_8px_#8A2BE2]"></span>
                </button>
              </Link>

              {/* Avatar do Usuário */}
              <div className="relative group cursor-pointer">
                <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-gato-amber via-gato-purple to-black animate-gradient-xy">
                  <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gato-gray flex items-center justify-center text-sm text-white font-bold uppercase select-none">
                      {user?.fullName?.charAt(0) || <UserIcon className="w-4 h-4"/>}
                    </div>
                  </div>
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <div className="bg-gato-gray border border-white/10 rounded-xl shadow-2xl p-2 w-48 overflow-hidden backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-xs text-gato-muted">Logado como</p>
                      <p className="text-sm font-bold text-white truncate">{user?.fullName}</p>
                    </div>
                    
                    {isAdminOrUploader && (
                      <Link href="/admin/dashboard">
                        <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gato-purple font-bold hover:bg-gato-purple/10 rounded-lg transition-colors mb-1">
                          <ShieldCheck className="w-4 h-4" /> Admin Panel
                        </button>
                      </Link>
                    )}

                    <Link href="/perfil">
                      <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gato-ghost hover:bg-white/5 rounded-lg transition-colors">
                        <UserIcon className="w-4 h-4" /> Meu Perfil
                      </button>
                    </Link>
                    
                    <button 
                      onClick={() => logout()}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sair
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* USUÁRIO NÃO LOGADO */
            mounted && (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="hidden md:block text-sm font-bold text-gato-ghost hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gato-purple hover:bg-gato-purple/90 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-gato-purple/20 active:scale-95"
                >
                  Criar Conta
                </Link>
              </div>
            )
          )}
          
          <button className="md:hidden text-white">
            <Menu className="w-6 h-6" />
          </button>

        </div>
      </div>
    </motion.header>
  );
}