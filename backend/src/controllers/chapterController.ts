import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChapterController {
  
  // ==========================================
  // 1. OBTER CONTEÚDO (LEITURA)
  // ==========================================
  async getContent(req: Request, res: Response) {
    try {
      const userId = req.userId; // Vem do middleware de auth
      const { id } = req.params; // ID do Capítulo atual

      // A. Busca o capítulo atual
      const chapter = await prisma.chapter.findUnique({ 
        where: { id },
        include: { work: true } 
      });
      
      if (!chapter) return res.status(404).json({ error: 'Capítulo não encontrado' });

      // B. Lógica de Segurança (Verifica se pagou)
      if (!chapter.isFree && chapter.price > 0) {
        if (!userId) return res.status(401).json({ error: 'Login necessário' });

        const unlock = await prisma.unlock.findUnique({
          where: { userId_chapterId: { userId, chapterId: id } }
        });

        if (!unlock) return res.status(403).json({ error: 'Acesso negado. Compre o capítulo.' });

        // VERIFICAÇÃO DE VALIDADE (Para Patinha Lite / Aluguel)
        if (unlock.expiresAt && new Date() > unlock.expiresAt) {
           return res.status(403).json({ error: 'Seu acesso temporário expirou.' });
        }
      }

      // C. Lógica de Navegação (Buscar vizinhos e verificar se estão bloqueados)
      const [prevChapter, nextChapter] = await Promise.all([
        // Anterior: O maior número que seja menor que o atual
        prisma.chapter.findFirst({
          where: { workId: chapter.workId, number: { lt: chapter.number } },
          orderBy: { number: 'desc' },
          select: { id: true, price: true, isFree: true }
        }),
        // Próximo: O menor número que seja maior que o atual
        prisma.chapter.findFirst({
          where: { workId: chapter.workId, number: { gt: chapter.number } },
          orderBy: { number: 'asc' },
          select: { id: true, price: true, isFree: true }
        })
      ]);

      // Função auxiliar para checar status de bloqueio dos vizinhos
      const checkLock = async (chap: any) => {
        if (!chap) return null;
        // Se for grátis, não está bloqueado
        if (chap.isFree || chap.price === 0) return { id: chap.id, isLocked: false, price: 0 };
        
        // Se não tiver user (visitante), está bloqueado
        if (!userId) return { id: chap.id, isLocked: true, price: chap.price };

        const unlock = await prisma.unlock.findUnique({
            where: { userId_chapterId: { userId, chapterId: chap.id } }
        });
        
        // Se tem unlock e (é permanente OU não expirou)
        const hasAccess = unlock && (!unlock.expiresAt || unlock.expiresAt > new Date());
        
        return { id: chap.id, isLocked: !hasAccess, price: chap.price };
      };

      const prevInfo = await checkLock(prevChapter);
      const nextInfo = await checkLock(nextChapter);

      return res.json({ 
        pages: chapter.pages, 
        title: chapter.title,
        number: chapter.number,
        prev: prevInfo, // Objeto { id, isLocked, price } ou null
        next: nextInfo  // Objeto { id, isLocked, price } ou null
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar conteúdo' });
    }
  }

  // ==========================================
  // 2. DESBLOQUEAR (COMPRA)
  // ==========================================
  async unlock(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { method } = req.body; // 'premium' (padrão) ou 'lite'

      const result = await prisma.$transaction(async (tx) => {
        const chapter = await tx.chapter.findUnique({ where: { id } });
        const user = await tx.user.findUnique({ where: { id: userId } });

        if (!chapter || !user) throw new Error('Dados inválidos');

        // Verifica se já tem e se está válido
        const existingUnlock = await tx.unlock.findUnique({
          where: { userId_chapterId: { userId, chapterId: id } }
        });
        
        if (existingUnlock) {
           // Se for permanente ou válido, retorna sucesso sem cobrar de novo
           if (!existingUnlock.expiresAt || existingUnlock.expiresAt > new Date()) {
               return { success: true, message: 'Já possui acesso' };
           }
           // Se expirou (Lite antigo), deleta o registro para criar um novo
           await tx.unlock.delete({ where: { id: existingUnlock.id } });
        }

        // --- LÓGICA LITE (ALUGUEL) ---
        if (method === 'lite') {
            const cost = 2; // Custo Fixo de 2 Patinhas Lite
            if (user.patinhasLite < cost) throw new Error('Saldo Lite insuficiente');

            // Debita Lite
            await tx.user.update({
                where: { id: userId },
                data: { patinhasLite: { decrement: cost } }
            });

            // Cria Unlock Temporário (3 Dias)
            await tx.unlock.create({
                data: { 
                    userId, 
                    chapterId: id, 
                    type: 'RENTAL_AD',
                    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) 
                }
            });

            // Retorna saldo atualizado para o front
            return { success: true, type: 'lite', newBalanceLite: user.patinhasLite - cost };
        } 
        
        // --- LÓGICA PREMIUM (PERMANENTE) ---
        else {
            if (user.patinhasBalance < chapter.price) throw new Error('Saldo insuficiente');

            // Debita Premium
            await tx.user.update({
                where: { id: userId },
                data: { patinhasBalance: { decrement: chapter.price } }
            });

            // Cria Unlock Permanente
            await tx.unlock.create({
                data: { userId, chapterId: id, type: 'PERMANENT' }
            });
            
            // Registra transação financeira (Audit)
            await tx.transaction.create({
                data: { userId, type: 'SPENT_CHAPTER', amount: -chapter.price, referenceId: chapter.id }
            });

            return { success: true, type: 'premium', newBalance: user.patinhasBalance - chapter.price };
        }
      });

      return res.json(result);

    } catch (error: any) {
      if (error.message.includes('insuficiente')) return res.status(400).json({ error: error.message });
      console.error(error);
      return res.status(500).json({ error: 'Erro ao processar compra' });
    }
  }

  // ==========================================
  // 3. GESTÃO (ADMIN)
  // ==========================================

  // CRIAR CAPÍTULO
  async create(req: Request, res: Response) {
    try {
      const { workId } = req.params;
      const { number, title, price, pages } = req.body;

      const chapter = await prisma.chapter.create({
        data: {
          workId,
          number: parseFloat(number),
          title,
          price: parseInt(price),
          isFree: parseInt(price) === 0,
          pages: pages || []
        }
      });

      return res.status(201).json(chapter);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar capítulo' });
    }
  }

  // DELETAR CAPÍTULO
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Limpa dependências antes de apagar
      await prisma.unlock.deleteMany({ where: { chapterId: id } });
      await prisma.comment.deleteMany({ where: { chapterId: id } });
      
      await prisma.chapter.delete({ where: { id } });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar capítulo' });
    }
  }
}