import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface UserState {
  // Dados de Auth
  token: string | null;
  user: UserData | null;
  isAuthenticated: boolean;

  // Dados da Carteira
  patinhas: number;
  unlockedChapters: string[];

  // Ações
  login: (token: string, user: UserData, patinhas: number) => void;
  logout: () => void;
  addPatinhas: (amount: number) => void;
  unlockChapter: (workId: string, chapterId: string, cost: number) => boolean;
  isUnlocked: (workId: string, chapterId: string) => boolean;
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

      // Ações de Auth
      login: (token, user, patinhas) => set({ 
        token, 
        user, 
        patinhas, 
        isAuthenticated: true 
      }),

      logout: () => set({ 
        token: null, 
        user: null, 
        isAuthenticated: false, 
        patinhas: 0,
        unlockedChapters: [] 
      }),

      // Ações de Carteira (Mockada no Frontend por enquanto, idealmente bateria na API)
      addPatinhas: (amount) => set((state) => ({ patinhas: state.patinhas + amount })),

      unlockChapter: (workId, chapterId, cost) => {
        const { patinhas, unlockedChapters } = get();
        const key = `${workId}-${chapterId}`;

        if (unlockedChapters.includes(key)) return true;
        if (patinhas < cost) return false;

        set({
          patinhas: patinhas - cost,
          unlockedChapters: [...unlockedChapters, key],
        });
        return true;
      },

      isUnlocked: (workId, chapterId) => {
        const key = `${workId}-${chapterId}`;
        return get().unlockedChapters.includes(key);
      },
    }),
    {
      name: 'gato-comics-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);