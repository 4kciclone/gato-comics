import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '@/lib/api'; // Certifique-se de que este caminho está correto

// --- TIPOS ---
interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  patinhasBalance?: number;
  patinhasLite?: number;
}

interface UnlockedChapter {
  workId: string;
  chapterId: string;
  pricePaid: number;
}

interface UserState {
  // Dados de Auth
  token: string | null;
  user: UserData | null;
  isAuthenticated: boolean;

  // Dados da Carteira
  patinhas: number;
  unlockedChapters: string[]; // Formato: "workId-chapterId"
  unlockedDetails: UnlockedChapter[]; // Detalhes completos dos unlocks

  // Ações
  login: (token: string, user: UserData, patinhas: number) => void;
  logout: () => void;
  addPatinhas: (amount: number) => void;
  unlockChapter: (workId: string, chapterId: string, cost: number) => boolean;
  isUnlocked: (workId: string, chapterId: string) => boolean;
  syncUnlocksFromBackend: () => Promise<void>; // ← NOVA
  setToken: (token: string) => void; // ← NOVA (útil para hidratação)
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Estado Inicial
      token: null,
      user: null,
      isAuthenticated: false,
      patinhas: 0,
      unlockedChapters: [],
      unlockedDetails: [],

      // ==========================================
      // LOGIN
      // ==========================================
      login: (token, user, patinhas) => {
        // Configura o token no axios globalmente
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        set({ 
          token, 
          user, 
          patinhas, 
          isAuthenticated: true 
        });

        // Sincroniza os unlocks após o login
        console.log('[Store] Login realizado, sincronizando unlocks...');
        get().syncUnlocksFromBackend();
      },

      // ==========================================
      // LOGOUT
      // ==========================================
      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false, 
          patinhas: 0,
          unlockedChapters: [],
          unlockedDetails: []
        });
      },

      // ==========================================
      // ADICIONAR PATINHAS
      // ==========================================
      addPatinhas: (amount) => set((state) => ({ 
        patinhas: state.patinhas + amount 
      })),

      // ==========================================
      // DESBLOQUEAR CAPÍTULO (Local + Otimista)
      // ==========================================
      unlockChapter: (workId, chapterId, cost) => {
        const { patinhas, unlockedChapters } = get();
        const key = `${workId}-${chapterId}`;

        if (unlockedChapters.includes(key)) {
          console.log('[Store] Capítulo já está desbloqueado localmente');
          return true;
        }

        // Permite "comprar" se o custo for 0 mesmo sem saldo
        if (cost > 0 && patinhas < cost) {
          console.log('[Store] Saldo insuficiente para desbloquear');
          return false;
        }

        console.log(`[Store] Desbloqueando ${key} (custo: ${cost})`);

        set({
          patinhas: cost > 0 ? patinhas - cost : patinhas,
          unlockedChapters: [...unlockedChapters, key],
          unlockedDetails: [
            ...get().unlockedDetails,
            { workId, chapterId, pricePaid: cost }
          ]
        });
        
        return true;
      },

      // ==========================================
      // VERIFICAR SE ESTÁ DESBLOQUEADO
      // ==========================================
      isUnlocked: (workId, chapterId) => {
        const key = `${workId}-${chapterId}`;
        return get().unlockedChapters.includes(key);
      },

      // ==========================================
      // SINCRONIZAR UNLOCKS DO BACKEND
      // ==========================================
      syncUnlocksFromBackend: async () => {
        try {
          const { isAuthenticated, token } = get();
          
          if (!isAuthenticated || !token) {
            console.log('[Store] Não autenticado, pulando sync de unlocks');
            return;
          }
          
          console.log('[Store] 🔄 Sincronizando unlocks do backend...');
          
          // Busca os unlocks do backend
          const response = await api.get('/auth/unlocks');
          
          if (response.data.success && response.data.unlocks) {
            const backendUnlocks = response.data.unlocks;
            
            console.log(`[Store] ✅ ${backendUnlocks.length} unlocks encontrados no backend`);
            
            // Converte para o formato da store
            const unlockedKeys = backendUnlocks.map((u: any) => 
              `${u.workId}-${u.chapterId}`
            );
            
            const unlockedDetails = backendUnlocks.map((u: any) => ({
              workId: u.workId,
              chapterId: u.chapterId,
              pricePaid: u.pricePaid || 0
            }));
            
            // Mescla com unlocks locais (evita perder unlocks recentes)
            const currentUnlocks = get().unlockedChapters;
            const mergedUnlocks = Array.from(new Set([...currentUnlocks, ...unlockedKeys]));
            
            set({ 
              unlockedChapters: mergedUnlocks,
              unlockedDetails: unlockedDetails 
            });
            
            console.log(`[Store] 💾 Total de unlocks após merge: ${mergedUnlocks.length}`);
          }
        } catch (error: any) {
          console.error('[Store] ❌ Erro ao sincronizar unlocks:', error);
          
          // Se for erro 401 (token expirado), faz logout
          if (error.response?.status === 401) {
            console.log('[Store] Token expirado, fazendo logout automático...');
            get().logout();
          }
        }
      },

      // ==========================================
      // DEFINIR TOKEN (útil para hidratação)
      // ==========================================
      setToken: (token: string) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token });
      }
    }),
    {
      name: 'gato-comics-auth',
      storage: createJSONStorage(() => localStorage),
      
      // ==========================================
      // HIDRATAÇÃO: Restaura token e sincroniza
      // ==========================================
      onRehydrateStorage: () => (state) => {
        console.log('[Store] 💧 Hidratando estado do localStorage...');
        
        if (state?.isAuthenticated && state?.token) {
          // Restaura o token no axios
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          
          console.log('[Store] Token restaurado, sincronizando unlocks...');
          
          // Sincroniza os unlocks após hidratar
          // Usar setTimeout para evitar race condition
          setTimeout(() => {
            state.syncUnlocksFromBackend();
          }, 100);
        } else {
          console.log('[Store] Nenhum usuário autenticado para hidratar');
        }
      }
    }
  )
);