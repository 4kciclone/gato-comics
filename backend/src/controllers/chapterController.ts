import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // Necessário para checagem manual

const prisma = new PrismaClient();

export class ChapterController {
  
  // ==========================================
  // 1. OBTER CONTEÚDO (HÍBRIDO + NAVEGAÇÃO INTELIGENTE)
  // ==========================================
  async getContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      let userId: string | null = null;

      // 1. Tenta identificar o usuário (Soft Auth)
      // Não barra se falhar, apenas define userId como null
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
          userId = decoded.id;
        } catch (e) {
          // Token inválido/expirado, segue como visitante
        }
      }

      // 2. Busca o capítulo atual
      const chapter = await prisma.chapter.findUnique({ 
        where: { id },
        include: { work: true } 
      });
      
      if (!chapter) return res.status(404).json({ error: 'Capítulo não encontrado' });

      // 3. Verifica Permissão de Leitura do ATUAL
      // Se for pago E (não tem usuário OU usuário não comprou/aluguel venceu)
      if (!chapter.isFree && chapter.price > 0) {
        let hasAccess = false;

        if (userId) {
          const unlock = await prisma.unlock.findUnique({
            where: { userId_chapterId: { userId, chapterId: id } }
          });
          // Tem unlock E (é permanente OU data de expiração é futura)
          if (unlock && (!unlock.expiresAt || unlock.expiresAt > new Date())) {
            hasAccess = true;
          }
        }

        if (!hasAccess) {
          // Retorna erro 403 mas envia dados básicos para o front saber que existe
          return res.status(403).json({ 
            error: 'Capítulo Bloqueado',
            chapter: { id: chapter.id, title: chapter.title, number: chapter.number, price: chapter.price }
          });
        }
      }

      // 4. Busca Vizinhos (Anterior e Próximo)
      // Usamos findFirst com ordenação para pegar o vizinho exato
      const [prevChapter, nextChapter] = await Promise.all([
        prisma.chapter.findFirst({
          where: { workId: chapter.workId, number: { lt: chapter.number } },
          orderBy: { number: 'desc' }, // O maior número menor que o atual (ex: atual 5 -> busca 4)
          select: { id: true, price: true, isFree: true, number: true }
        }),
        prisma.chapter.findFirst({
          where: { workId: chapter.workId, number: { gt: chapter.number } },
          orderBy: { number: 'asc' }, // O menor número maior que o atual (ex: atual 5 -> busca 6)
          select: { id: true, price: true, isFree: true, number: true }
        })
      ]);

      // 5. Função para verificar se o vizinho está bloqueado para este usuário
      const checkLock = async (chap: any) => {
        if (!chap) return null;
        
        // Se for grátis, está liberado para todos
        if (chap.isFree || chap.price === 0) {
            return { id: chap.id, isLocked: false, price: 0, number: chap.number };
        }
        
        // Se for pago e visitante, está trancado
        if (!userId) {
            return { id: chap.id, isLocked: true, price: chap.price, number: chap.number };
        }

        // Se for pago e logado, checa se comprou
        const unlock = await prisma.unlock.findUnique({
            where: { userId_chapterId: { userId, chapterId: chap.id } }
        });
        
        const hasAccess = unlock && (!unlock.expiresAt || unlock.expiresAt > new Date());
        
        return { id: chap.id, isLocked: !hasAccess, price: chap.price, number: chap.number };
      };

      const prevInfo = await checkLock(prevChapter);
      const nextInfo = await checkLock(nextChapter);

      // 6. Retorna tudo
      return res.json({ 
        pages: chapter.pages, 
        title: chapter.title,
        number: chapter.number,
        prev: prevInfo, 
        next: nextInfo
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar conteúdo' });
    }
  }

  // 2. DESBLOQUEAR (Mantido igual, mas garantindo a lógica Lite)
  async unlock(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { method } = req.body; // 'premium' ou 'lite'

      const result = await prisma.$transaction(async (tx) => {
        const chapter = await tx.chapter.findUnique({ where: { id } });
        const user = await tx.user.findUnique({ where: { id: userId } });

        if (!chapter || !user) throw new Error('Dados inválidos');

        // Verifica validade atual
        const existingUnlock = await tx.unlock.findUnique({
          where: { userId_chapterId: { userId, chapterId: id } }
        });
        
        if (existingUnlock) {
           if (!existingUnlock.expiresAt || existingUnlock.expiresAt > new Date()) {
               return { success: true, message: 'Já possui acesso' };
           }
           await tx.unlock.delete({ where: { id: existingUnlock.id } }); // Remove vencido
        }

        if (method === 'lite') {
            const cost = 2; 
            if (user.patinhasLite < cost) throw new Error('Saldo Lite insuficiente');

            await tx.user.update({
                where: { id: userId },
                data: { patinhasLite: { decrement: cost } }
            });

            await tx.unlock.create({
                data: { 
                    userId, chapterId: id, type: 'RENTAL_AD',
                    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 Dias
                }
            });
            return { success: true, type: 'lite', newBalanceLite: user.patinhasLite - cost };
        } else {
            if (user.patinhasBalance < chapter.price) throw new Error('Saldo insuficiente');

            await tx.user.update({
                where: { id: userId },
                data: { patinhasBalance: { decrement: chapter.price } }
            });

            await tx.unlock.create({ data: { userId, chapterId: id, type: 'PERMANENT' } });
            
            await tx.transaction.create({
                data: { userId, type: 'SPENT_CHAPTER', amount: -chapter.price, referenceId: chapter.id }
            });

            return { success: true, type: 'premium', newBalance: user.patinhasBalance - chapter.price };
        }
      });
      return res.json(result);
    } catch (error: any) {
      if (error.message.includes('insuficiente')) return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: 'Erro ao processar compra' });
    }
  }

  // ... (create e delete iguais)
  async create(req: Request, res: Response) {
    try {
      const { workId } = req.params;
      const { number, title, price, pages } = req.body;
      const chapter = await prisma.chapter.create({
        data: { workId, number: parseFloat(number), title, price: parseInt(price), isFree: parseInt(price) === 0, pages: pages || [] }
      });
      return res.status(201).json(chapter);
    } catch (error) { return res.status(500).json({ error: 'Erro create' }); }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.unlock.deleteMany({ where: { chapterId: id } });
      await prisma.comment.deleteMany({ where: { chapterId: id } });
      await prisma.chapter.delete({ where: { id } });
      return res.json({ success: true });
    } catch (error) { return res.status(500).json({ error: 'Erro delete' }); }
  }
}