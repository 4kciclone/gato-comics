"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, PawPrint, LogOut, User as UserIcon, ShieldCheck, Users, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";

export function Navbar() {
  const router = useRouter();
  const { patinhas, isAuthenticated, user, logout } = useUserStore();
  
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // <--- NOVO ESTADO

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
      <header className="fixed top-0 left-0 right-0 z-50 h-16 shadow-lg overflow-visible border-b border-black/10">
        
        {/* --- CAMADA 1: FUNDO GRADIENTE --- */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#FFD700] animate-gradient-xy bg-[length:200%_200%]" />
        
        {/* --- CAMADA 2: TEXTURA --- */}
        <div 
            className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ 
                backgroundImage: 'radial-gradient(black 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }} 
        />

        {/* --- CAMADA 3: BRILHOS --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 bottom-0 w-20 bg-white/20 skew-x-12 blur-xl animate-shine-slide" />
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="container mx-auto h-full flex items-center justify-between px-4 md:px-6 relative z-10">
          
          {/* LOGO */}
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 hover:bg-black/10 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6 text-black" />
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-black text-[#FFD700] p-1.5 rounded-xl shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-2 border-black">
                <PawPrint className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase hidden min-[350px]:block text-black drop-shadow-sm">
                Gato <span className="font-light">Comics</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6 ml-6">
                <Link href="/comunidade" className="flex items-center gap-2 text-sm font-bold text-black/70 hover:text-black transition-colors uppercase tracking-wide hover:scale-105 transform duration-200">
                    <Users className="w-4 h-4" /> Comunidade
                </Link>
            </div>
          </div>

          {/* BUSCA */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60 group-focus-within:text-gato-purple transition-colors">
                    <Search className="w-4 h-4" />
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar obras..."
                    onKeyDown={handleSearch}
                    className="w-full bg-white/40 hover:bg-white/60 focus:bg-white border-2 border-transparent focus:border-black rounded-full py-2 pl-10 pr-4 text-sm text-black placeholder:text-black/50 outline-none shadow-sm transition-all duration-300"
                />
            </div>
          </div>

          {/* USUÁRIO */}
          <div className="flex items-center gap-3">
            {mounted && isAuthenticated ? (
                <>
                    <Link href="/loja">
                        <div className="flex items-center gap-1.5 bg-black text-[#FFD700] px-3 py-1.5 rounded-full font-bold text-sm hover:scale-105 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all cursor-pointer border-2 border-black">
                            <PawPrint className="w-3 h-3 fill-current animate-pulse" />
                            <span>{patinhas}</span>
                        </div>
                    </Link>

                    {/* LÓGICA DE CLIQUE NO AVATAR */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)} // Toggle
                            className="w-10 h-10 rounded-full bg-black p-0.5 shadow-md hover:scale-105 transition-all outline-none focus:ring-2 focus:ring-black/50"
                        >
                             <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    user?.fullName?.charAt(0) || <UserIcon className="w-4 h-4"/>
                                )}
                             </div>
                        </button>
                        
                        {/* Dropdown Animado */}
                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    {/* Backdrop invisível para fechar ao clicar fora */}
                                    <div 
                                        className="fixed inset-0 z-30 cursor-default" 
                                        onClick={() => setIsProfileOpen(false)} 
                                    />
                                    
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 top-full mt-3 w-56 z-40 bg-white rounded-xl shadow-2xl border-2 border-black overflow-hidden text-black"
                                    >
                                        <div className="px-4 py-3 border-b-2 border-black/5 bg-gray-50 flex flex-col gap-1">
                                            <p className="text-xs text-gray-500 uppercase font-bold">Logado como</p>
                                            <p className="text-sm font-black truncate">{user?.fullName}</p>
                                        </div>
                                        <div className="p-1 flex flex-col gap-1">
                                            {isAdminOrUploader && (
                                                <Link href="/admin/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 text-purple-700 font-bold rounded-lg transition-colors">
                                                    <ShieldCheck className="w-4 h-4"/> Painel Admin
                                                </Link>
                                            )}
                                            <Link href="/perfil" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-yellow-50 text-black font-medium rounded-lg transition-colors">
                                                <UserIcon className="w-4 h-4"/> Meu Perfil
                                            </Link>
                                            <button 
                                                onClick={() => { logout(); setIsProfileOpen(false); }} 
                                                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 font-medium rounded-lg transition-colors"
                                            >
                                                <LogOut className="w-4 h-4"/> Sair
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            ) : mounted && (
                <Link href="/login" className="bg-black text-[#FFD700] hover:bg-zinc-800 px-6 py-2 rounded-full font-black text-sm transition-all shadow-md hover:shadow-lg border-2 border-transparent hover:border-[#FFD700]">
                    Entrar
                </Link>
            )}
          </div>

        </div>
      </header>

      {/* MENU MOBILE */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm md:hidden"
                />
                <motion.div 
                    initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-4/5 max-w-xs bg-[#FFD700] z-[70] shadow-2xl md:hidden flex flex-col border-r-4 border-black"
                >
                    <div className="p-5 flex justify-between items-center border-b-2 border-black">
                        <span className="font-black text-xl text-black uppercase tracking-tighter">Gato Comics</span>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-black text-[#FFD700] rounded-full hover:scale-110 transition-transform">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
                            <input 
                                type="text" 
                                placeholder="Buscar..."
                                onKeyDown={handleSearch}
                                className="w-full bg-white border-2 border-black rounded-lg py-3 pl-10 pr-4 text-black placeholder:text-black/50 font-medium outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 bg-white/20 border-2 border-transparent hover:border-black rounded-lg font-bold text-black transition-all">
                                Início
                            </Link>
                            <Link href="/comunidade" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 bg-white/20 border-2 border-transparent hover:border-black rounded-lg font-bold text-black transition-all">
                                Comunidade
                            </Link>
                            <Link href="/loja" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 bg-white/20 border-2 border-transparent hover:border-black rounded-lg font-bold text-black transition-all">
                                Loja de Patinhas
                            </Link>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-black">
                        {isAuthenticated ? (
                             <button onClick={() => {logout(); setIsMobileMenuOpen(false)}} className="w-full py-3 bg-[#FFD700] text-black rounded-lg font-black uppercase tracking-wider hover:bg-white transition-colors">
                                Sair da Conta
                             </button>
                        ) : (
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-3 bg-[#FFD700] text-black rounded-lg font-black uppercase tracking-wider text-center hover:bg-white transition-colors">
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