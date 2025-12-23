"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Search, Menu, PawPrint, LogOut, User as UserIcon, 
  ShieldCheck, Users, X, Sparkles, Zap, ChevronRight, ShoppingBag 
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";
import { CosmeticRenderer } from "@/components/ui/CosmeticRenderer";

export function Navbar() {
  const router = useRouter();
  const { patinhas, isAuthenticated, user, logout } = useUserStore();
  
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const menuVariants: Variants = {
    closed: { x: "-100%" },
    open: { 
        x: 0,
        transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1 }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 md:h-24 shadow-lg overflow-visible border-b border-black/10 transition-all duration-300">
        
        {/* --- CAMADA 1: FUNDO GRADIENTE --- */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#FFD700] animate-gradient-xy bg-[length:200%_200%]" />
        
        {/* --- CAMADA 2: TEXTURA --- */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* --- CAMADA 3: BRILHOS --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 bottom-0 w-20 bg-white/20 skew-x-12 blur-xl animate-shine-slide" />
        </div>

        {/* --- CONTEÚDO --- */}
        <div className="container mx-auto h-full flex items-center justify-between px-4 md:px-6 relative z-10">
          
          {/* LADO ESQUERDO: MENU + LOGO */}
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              className="md:hidden p-2 bg-black/10 hover:bg-black/20 rounded-lg transition-colors active:scale-95"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6 text-black" />
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              {/* LOGO DESKTOP (GRANDE) */}
              <div className="relative h-10 w-auto md:h-20 aspect-[3/1] transition-transform duration-300 group-hover:scale-105">
                 <Image 
                    src="/logo.png" 
                    alt="Gato Comics"
                    width={300}
                    height={100}
                    className="h-full w-auto object-contain drop-shadow-sm"
                    priority
                 />
              </div>
            </Link>

            {/* LINKS DESKTOP APENAS */}
            <div className="hidden lg:flex items-center gap-6 ml-4 border-l-2 border-black/10 pl-6">
                <Link href="/comunidade" className="flex items-center gap-2 text-sm font-bold text-black/70 hover:text-black transition-colors uppercase tracking-wide hover:scale-105 transform duration-200">
                    <Users className="w-4 h-4" /> Comunidade
                </Link>
            </div>
          </div>

          {/* CENTRO: BUSCA (Apenas Desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/60 group-focus-within:text-gato-purple transition-colors">
                    <Search className="w-5 h-5" />
                </div>
                <input 
                    type="text" 
                    placeholder="O que vamos ler hoje?"
                    onKeyDown={handleSearch}
                    className="w-full bg-white/50 hover:bg-white/80 focus:bg-white border-2 border-transparent focus:border-black rounded-full py-2.5 pl-12 pr-4 text-sm text-black placeholder:text-black/50 font-medium outline-none shadow-sm transition-all duration-300"
                />
            </div>
          </div>

          {/* LADO DIREITO: USUÁRIO */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Botão de Busca Mobile (Abre Menu) */}
            <button className="md:hidden p-2 hover:bg-black/10 rounded-full" onClick={() => setIsMobileMenuOpen(true)}>
                <Search className="w-6 h-6 text-black" />
            </button>

            {mounted && isAuthenticated ? (
                <>
                    <Link href="/loja">
                        <div className="flex items-center gap-1.5 bg-black text-[#FFD700] px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm hover:scale-105 hover:shadow-lg transition-all cursor-pointer border-2 border-black">
                            <PawPrint className="w-3 h-3 md:w-4 md:h-4 fill-current animate-pulse" />
                            <span>{patinhas}</span>
                        </div>
                    </Link>

                    <div className="relative">
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-black p-0.5 shadow-md hover:scale-105 transition-all outline-none focus:ring-2 focus:ring-black/50"
                        >
                             <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    user?.fullName?.charAt(0) || <UserIcon className="w-4 h-4"/>
                                )}
                             </div>
                        </button>
                        
                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-30 cursor-default" onClick={() => setIsProfileOpen(false)} />
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
                                            <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 font-medium rounded-lg transition-colors">
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
                <Link href="/login" className="bg-black text-[#FFD700] hover:bg-zinc-800 px-4 py-1.5 md:px-6 md:py-2 rounded-full font-black text-xs md:text-sm transition-all shadow-md hover:shadow-lg border-2 border-transparent hover:border-[#FFD700]">
                    Entrar
                </Link>
            )}
          </div>

        </div>
      </header>

      {/* --- MENU MOBILE (DRAWER) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-md md:hidden"
                />
                
                <motion.div 
                    variants={menuVariants}
                    initial="closed" animate="open" exit="closed"
                    className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-[#FFD700] z-[70] shadow-2xl md:hidden flex flex-col border-r-4 border-black overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

                    {/* Header do Menu */}
                    <div className="relative p-6 bg-black text-[#FFD700] rounded-br-[40px] shadow-lg border-b-4 border-white/20">
                        <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white">
                            <X className="w-6 h-6" />
                        </button>

                        {isAuthenticated && user ? (
                            <motion.div variants={itemVariants} className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-[#FFD700] flex items-center justify-center text-2xl font-bold text-white uppercase shadow-lg overflow-hidden">
                                         {user?.fullName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Caçador</p>
                                        <p className="text-lg font-black text-white leading-tight">{user.fullName}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-zinc-800/50 rounded-lg p-2 flex items-center gap-2 border border-white/10">
                                        <PawPrint className="w-4 h-4 text-[#FFD700]" />
                                        <span className="font-bold text-white">{patinhas}</span>
                                    </div>
                                    <div className="flex-1 bg-zinc-800/50 rounded-lg p-2 flex items-center gap-2 border border-white/10">
                                        <Zap className="w-4 h-4 text-green-400" />
                                        <span className="font-bold text-white">VIP</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                             <motion.div variants={itemVariants} className="py-4">
                                
                                {/* --- EFEITO STICKER DA LOGO (OPÇÃO 1) --- */}
                                <div className="mb-6 relative flex justify-center">
                                    <div className="absolute inset-0 bg-[#FFD700] blur-2xl opacity-20 pointer-events-none" />
                                    <div className="relative bg-white p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(255,215,0,1)] border-2 border-black transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                                        <Image 
                                            src="/logo.png" 
                                            alt="Gato Comics"
                                            width={180}
                                            height={60}
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                                {/* --------------------------------------- */}

                                <p className="text-zinc-400 text-sm mb-4 text-center">Entre para sincronizar seu progresso.</p>
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-4 bg-[#FFD700] text-black rounded-xl font-black uppercase tracking-wider text-center hover:scale-[1.02] transition-transform shadow-lg border-2 border-transparent hover:border-white">
                                    Fazer Login
                                </Link>
                             </motion.div>
                        )}
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto space-y-6 relative z-10">
                        <motion.div variants={itemVariants} className="relative shadow-sm">
                            <input 
                                type="text" 
                                placeholder="O que vamos ler?"
                                onKeyDown={handleSearch}
                                className="w-full bg-white border-2 border-black rounded-xl py-4 pl-12 pr-4 text-black placeholder:text-black/40 font-bold outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                        </motion.div>

                        <div className="space-y-2">
                            {[
                                { href: "/", label: "Início", icon: PawPrint },
                                { href: "/comunidade", label: "Comunidade", icon: Users },
                                { href: "/loja", label: "Loja de Patinhas", icon: ShoppingBag },
                                { href: "/perfil", label: "Meu Perfil", icon: UserIcon, auth: true },
                            ].map((link) => (
                                (!link.auth || isAuthenticated) && (
                                    <motion.div key={link.href} variants={itemVariants}>
                                        <Link 
                                            href={link.href} 
                                            onClick={() => setIsMobileMenuOpen(false)} 
                                            className="group flex items-center justify-between p-3 rounded-xl hover:bg-black/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-black/10 p-2 rounded-lg group-hover:bg-black group-hover:text-[#FFD700] transition-colors">
                                                    <link.icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-xl font-black text-black italic uppercase tracking-tighter group-hover:translate-x-1 transition-transform">
                                                    {link.label}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-black/30 group-hover:text-black" />
                                        </Link>
                                    </motion.div>
                                )
                            ))}
                        </div>
                    </div>
                    
                    {isAuthenticated && (
                        <motion.div variants={itemVariants} className="p-6 bg-black/5 border-t border-black/10 relative z-10">
                             <button 
                                onClick={() => {logout(); setIsMobileMenuOpen(false)}} 
                                className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg"
                             >
                                <LogOut className="w-5 h-5" /> Sair da Conta
                             </button>
                        </motion.div>
                    )}
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </>
  );
}