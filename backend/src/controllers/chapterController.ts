import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ChapterController {
  
  // 1. OBTER CONTEÚDO (Com Navegação Prev/Next)
  async getContent(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      // A. Busca o capítulo atual
      const chapter = await prisma.chapter.findUnique({ 
        where: { id },
        include: { work: true } 
      });
      
      if (!chapter) return res.status(404).json({ error: 'Capítulo não encontrado' });

      // B. Lógica de Segurança (Verifica se pagou)
      if (!chapter.isFree && chapter.price > 0) {
        const unlock = await prisma.unlock.findUnique({
          where: { userId_chapterId: { userId: userId!, chapterId: id } }
        });
        if (!unlock) return res.status(403).json({ error: 'Acesso negado' });
      }

      // C. Lógica de Navegação (Buscar vizinhos)
      const [prevChapter, nextChapter] = await Promise.all([
        // Anterior: O maior número que seja menor que o atual
        prisma.chapter.findFirst({
          where: { workId: chapter.workId, number: { lt: chapter.number } },
          orderBy: { number: 'desc' },
          select: { id: true }
        }),
        // Próximo: O menor número que seja maior que o atual
        prisma.chapter.findFirst({
          where: { workId: chapter.workId, number: { gt: chapter.number } },
          orderBy: { number: 'asc' },
          select: { id: true }
        })
      ]);

      return res.json({ 
        pages: chapter.pages, 
        title: chapter.title,
        number: chapter.number,
        prevId: prevChapter?.id || null, // ID do anterior ou null
        nextId: nextChapter?.id || null  // ID do próximo ou null
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar conteúdo' });
    }
  }

  // 2. DESBLOQUEAR (Compra)
  async unlock(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const result = await prisma.$transaction(async (tx) => {
        const chapter = await tx.chapter.findUnique({ where: { id } });
        const user = await tx.user.findUnique({ where: { id: userId } });

        if (!chapter || !user) throw new Error('Dados inválidos');

        const existingUnlock = await tx.unlock.findUnique({
          where: { userId_chapterId: { userId, chapterId: id } }
        });
        if (existingUnlock) return { success: true, message: 'Já possui' };

        if (user.patinhasBalance < chapter.price) throw new Error('Saldo insuficiente');

        await tx.user.update({
          where: { id: userId },
          data: { patinhasBalance: { decrement: chapter.price } }
        });

        await tx.unlock.create({
          data: { userId, chapterId: id, type: 'PERMANENT' }
        });

        await tx.transaction.create({
          data: { userId, type: 'SPENT_CHAPTER', amount: -chapter.price, referenceId: chapter.id }
        });

        return { success: true, newBalance: user.patinhasBalance - chapter.price };
      });

      return res.json(result);
    } catch (error: any) {
      if (error.message === 'Saldo insuficiente') return res.status(400).json({ error: 'Saldo insuficiente' });
      return res.status(500).json({ error: 'Erro ao processar compra' });
    }
  }

  // 3. CRIAR CAPÍTULO
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

  // 4. DELETAR CAPÍTULO
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.unlock.deleteMany({ where: { chapterId: id } });
      await prisma.comment.deleteMany({ where: { chapterId: id } });
      await prisma.chapter.delete({ where: { id } });
      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar capítulo' });
    }
  }
}