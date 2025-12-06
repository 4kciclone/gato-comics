"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { 
  LayoutDashboard, BookOpen, Users, DollarSign, 
  Settings, LogOut, ShieldCheck, Crown, Loader2, Palette 
} from "lucide-react";
import { motion } from "framer-motion";

// Quem pode entrar aqui?
const ALLOWED_ROLES = ['UPLOADER', 'ADMIN', 'OWNER'];

const MENU_ITEMS = [
  { 
    label: "Visão Geral", 
    href: "/admin/dashboard", 
    icon: LayoutDashboard, 
    allowed: ['UPLOADER', 'ADMIN', 'OWNER'] 
  },
  { 
    label: "Catálogo", 
    href: "/admin/works", 
    icon: BookOpen, 
    allowed: ['UPLOADER', 'ADMIN', 'OWNER'] 
  },
  { 
    label: "Usuários", 
    href: "/admin/users", 
    icon: Users, 
    allowed: ['ADMIN', 'OWNER'] 
  },
  { 
    label: "Financeiro", 
    href: "/admin/finance", 
    icon: DollarSign, 
    allowed: ['ADMIN', 'OWNER'] 
  },
  // --- NOVO ITEM ADICIONADO ---
  { 
    label: "Itens da Loja", 
    href: "/admin/items", 
    icon: Palette, 
    allowed: ['ADMIN', 'OWNER'] 
  },
  // ---------------------------
  { 
    label: "Configurações", 
    href: "/admin/settings", 
    icon: Settings, 
    allowed: ['OWNER'] 
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useUserStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    
    const checkAccess = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.push("/");
        return;
      }

      if (!ALLOWED_ROLES.includes(user.role)) {
        router.push("/");
        return;
      }

      setIsChecking(false);
    }, 100);

    return () => clearTimeout(checkAccess);
  }, [isAuthenticated, user, router]);

  if (!isMounted || isChecking) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-gato-purple animate-spin" />
          <p className="text-zinc-500 text-sm tracking-widest uppercase">Verificando Credenciais...</p>
        </div>
      </div>
    );
  }

  const userRole = user!.role;

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 overflow-hidden font-sans selection:bg-gato-purple selection:text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl flex flex-col relative z-20">
        
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-gato-purple">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-bold tracking-wider text-white">GATO<span className="text-gato-purple">ADMIN</span></span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg 
              ${userRole === 'OWNER' ? 'bg-gradient-to-br from-yellow-400 to-orange-600 text-black shadow-[0_0_15px_rgba(255,165,0,0.4)]' : 
                userRole === 'ADMIN' ? 'bg-gato-purple text-white' : 
                'bg-blue-500 text-white'}`}>
               {userRole === 'OWNER' ? <Crown className="w-5 h-5"/> : user!.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user!.fullName}</p>
              <p className="text-[10px] uppercase tracking-widest text-gato-muted font-bold">
                {userRole === 'UPLOADER' ? 'Uploader' : userRole}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="px-2 text-[10px] uppercase text-zinc-500 font-bold mb-2 tracking-widest">Menu Principal</p>
          
          {MENU_ITEMS.map((item) => {
            if (!item.allowed.includes(userRole)) return null;

            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 
                  ${isActive 
                    ? "bg-gato-purple/10 text-gato-purple" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gato-purple rounded-r-full shadow-[0_0_10px_#8A2BE2]"
                    />
                  )}
                  <item.icon className={`w-5 h-5 ${isActive ? "text-gato-purple" : "group-hover:text-white"}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gato-purple/5 blur-[120px] rounded-full pointer-events-none" />

        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-zinc-950/30 backdrop-blur-sm z-10">
          <h2 className="text-lg font-medium text-white">
            {MENU_ITEMS.find(i => i.href === pathname)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-xs text-gato-green bg-gato-green/10 px-2 py-1 rounded-full border border-gato-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-gato-green animate-pulse"/> Sistema Operacional
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {children}
        </div>
      </main>
    </div>
  );
}