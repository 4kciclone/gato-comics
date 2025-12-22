"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, PawPrint, LogOut, User as UserIcon, ShieldCheck, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";

export function Navbar() {
  const router = useRouter();
  const { patinhas, isAuthenticated, user, logout } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = e.currentTarget.value;
      if (term.trim()) {
        router.push(`/busca?q=${encodeURIComponent(term)}`);
        setIsMobileMenuOpen(false);
      }
    }
  };

  const isAdminOrUploader = user && ['ADMIN', 'OWNER', 'UPLOADER'].includes(user.role);

  return (
    <>
      {/* HEADER AMARELO */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#FFD700] text-black shadow-md">
        <div className="container mx-auto h-full flex items-center justify-between px-4 md:px-6">
          
          {/* 1. LOGO E MENU HAMBURGUER (ESQUERDA) */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-1 hover:bg-black/10 rounded-md transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6 text-black" />
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-black text-[#FFD700] p-1.5 rounded-lg transform group-hover:rotate-12 transition-transform">
                <PawPrint className="w-6 h-6 fill-current" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase hidden min-[350px]:block">
                Gato <span className="font-light">Comics</span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-6 ml-6">
                <Link href="/comunidade" className="flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity uppercase tracking-wide">
                    <Users className="w-4 h-4" /> Comunidade
                </Link>
                {/* Adicione mais links aqui se precisar */}
            </div>
          </div>

          {/* 2. BUSCA (CENTRO/DIREITA) */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50">
                    <Search className="w-4 h-4" />
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar obras..."
                    onKeyDown={handleSearch}
                    className="w-full bg-black/10 hover:bg-black/15 focus:bg-white border-none rounded-full py-2 pl-10 pr-4 text-sm text-black placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
                />
            </div>
          </div>

          {/* 3. AÇÕES DO USUÁRIO (DIREITA) */}
          <div className="flex items-center gap-3">
            {mounted && isAuthenticated ? (
                <>
                    {/* Saldo */}
                    <Link href="/loja">
                        <div className="flex items-center gap-1.5 bg-black text-[#FFD700] px-3 py-1.5 rounded-full font-bold text-sm hover:scale-105 transition-transform cursor-pointer shadow-sm">
                            <PawPrint className="w-3 h-3 fill-current" />
                            <span>{patinhas}</span>
                        </div>
                    </Link>

                    {/* Avatar */}
                    <div className="relative group cursor-pointer ml-1">
                        <div className="w-9 h-9 rounded-full bg-black p-0.5">
                             <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold">
                                {user?.fullName?.charAt(0) || <UserIcon className="w-4 h-4"/>}
                             </div>
                        </div>
                        {/* Dropdown */}
                        <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-48">
                             <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden text-black py-1">
                                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                                    <p className="text-xs text-gray-500">Olá,</p>
                                    <p className="text-sm font-bold truncate">{user?.fullName}</p>
                                </div>
                                {isAdminOrUploader && (
                                    <Link href="/admin/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 text-purple-600 font-bold">
                                        <ShieldCheck className="w-4 h-4"/> Admin
                                    </Link>
                                )}
                                <Link href="/perfil" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100">
                                    <UserIcon className="w-4 h-4"/> Perfil
                                </Link>
                                <button onClick={() => logout()} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 text-red-600">
                                    <LogOut className="w-4 h-4"/> Sair
                                </button>
                             </div>
                        </div>
                    </div>
                </>
            ) : mounted && (
                <Link href="/login" className="bg-black text-[#FFD700] hover:bg-black/80 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-sm">
                    Entrar
                </Link>
            )}
          </div>

        </div>
      </header>

      {/* MENU MOBILE (DRAWER) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm md:hidden"
                />
                <motion.div 
                    initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-[#FFD700] z-[70] shadow-2xl md:hidden flex flex-col"
                >
                    <div className="p-4 flex justify-between items-center border-b border-black/10">
                        <span className="font-black text-lg text-black uppercase">Menu</span>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-black/10 rounded-full hover:bg-black/20">
                            <X className="w-5 h-5 text-black" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                        {/* Busca Mobile */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
                            <input 
                                type="text" 
                                placeholder="Buscar..."
                                onKeyDown={handleSearch}
                                className="w-full bg-white/50 focus:bg-white rounded-lg py-3 pl-10 pr-4 text-black placeholder:text-black/50 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 bg-black/5 rounded-lg font-bold text-black hover:bg-black/10">
                                Início
                            </Link>
                            <Link href="/comunidade" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 bg-black/5 rounded-lg font-bold text-black hover:bg-black/10">
                                Comunidade
                            </Link>
                            <Link href="/loja" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 bg-black/5 rounded-lg font-bold text-black hover:bg-black/10">
                                Loja de Patinhas
                            </Link>
                        </div>
                    </div>
                    
                    {/* Footer Mobile */}
                    <div className="p-4 bg-black/5">
                        {isAuthenticated ? (
                             <button onClick={() => {logout(); setIsMobileMenuOpen(false)}} className="w-full py-3 bg-black text-[#FFD700] rounded-lg font-bold">
                                Sair da Conta
                             </button>
                        ) : (
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-3 bg-black text-[#FFD700] rounded-lg font-bold text-center">
                                Fazer Login
                            </Link>
                        )}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </>
  );
}