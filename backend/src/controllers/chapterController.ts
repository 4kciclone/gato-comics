import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class ChapterController {
  
  // 1. OBTER CONTEÚDO + NAVEGAÇÃO
  async getContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      let userId: string | null = null;

      // 1. Identificar Usuário (Manual, sem middleware para não barrar visitantes)
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
          userId = decoded.id;
        } catch (e) { /* Token inválido, segue como visitante */ }
      }

      // 2. Buscar Capítulo Atual
      const chapter = await prisma.chapter.findUnique({ 
        where: { id },
        include: { work: true } 
      });
      
      if (!chapter) return res.status(404).json({ error: 'Capítulo não encontrado' });

      // 3. Verificar Acesso ao CONTEÚDO ATUAL
      // (Se for pago e usuário não tiver acesso, bloqueia o array de imagens, mas retorna o resto para navegação)
      let showImages = true;
      if (!chapter.isFree && chapter.price > 0) {
        let hasAccess = false;
        if (userId) {
          const unlock = await prisma.unlock.findUnique({
            where: { userId_chapterId: { userId, chapterId: id } }
          });
          if (unlock && (!unlock.expiresAt || unlock.expiresAt > new Date())) {
            hasAccess = true;
          }
        }
        if (!hasAccess) showImages = false;
      }

      // 4. Buscar Vizinhos (Anterior/Próximo)
      const prevChapter = await prisma.chapter.findFirst({
        where: { workId: chapter.workId, number: { lt: chapter.number } },
        orderBy: { number: 'desc' },
        select: { id: true, price: true, isFree: true, number: true, title: true }
      });

      const nextChapter = await prisma.chapter.findFirst({
        where: { workId: chapter.workId, number: { gt: chapter.number } },
        orderBy: { number: 'asc' },
        select: { id: true, price: true, isFree: true, number: true, title: true }
      });

      // 5. Verificar se os vizinhos estão bloqueados (Para o botão de compra funcionar)
      const checkLock = async (chap: any) => {
        if (!chap) return null;
        
        // Se for grátis, está liberado
        if (chap.isFree || chap.price === 0) {
            return { ...chap, isLocked: false };
        }
        
        // Se for visitante, está trancado
        if (!userId) {
            return { ...chap, isLocked: true };
        }

        // Se logado, checa compra
        const unlock = await prisma.unlock.findUnique({
            where: { userId_chapterId: { userId, chapterId: chap.id } }
        });
        
        const hasAccess = unlock && (!unlock.expiresAt || unlock.expiresAt > new Date());
        return { ...chap, isLocked: !hasAccess };
      };

      const prevInfo = await checkLock(prevChapter);
      const nextInfo = await checkLock(nextChapter);

      // Debug no Terminal da VPS (Para você ver se achou)
      console.log(`[DEBUG] Cap ${chapter.number}. Prev: ${prevInfo?.number}, Next: ${nextInfo?.number}`);

      // Se não tiver acesso às imagens, retorna erro 403 MAS com os dados de navegação
      if (!showImages) {
        return res.status(403).json({ 
          error: 'Capítulo Bloqueado',
          chapter: { id: chapter.id, title: chapter.title, number: chapter.number },
          prev: prevInfo,
          next: nextInfo
        });
      }

      // Se tiver acesso, retorna tudo
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

  // 2. DESBLOQUEAR
  async unlock(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { method } = req.body; 

      const result = await prisma.$transaction(async (tx) => {
        const chapter = await tx.chapter.findUnique({ where: { id } });
        const user = await tx.user.findUnique({ where: { id: userId } });

        if (!chapter || !user) throw new Error('Dados inválidos');

        const existingUnlock = await tx.unlock.findUnique({
          where: { userId_chapterId: { userId, chapterId: id } }
        });
        
        if (existingUnlock) {
           if (!existingUnlock.expiresAt || existingUnlock.expiresAt > new Date()) {
               return { success: true, message: 'Já possui acesso' };
           }
           await tx.unlock.delete({ where: { id: existingUnlock.id } });
        }

        if (method === 'lite') {
            const cost = 2; 
            if (user.patinhasLite < cost) throw new Error('Saldo Lite insuficiente');
            await tx.user.update({ where: { id: userId }, data: { patinhasLite: { decrement: cost } } });
            await tx.unlock.create({
                data: { userId, chapterId: id, type: 'RENTAL_AD', expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
            });
            return { success: true, type: 'lite', newBalanceLite: user.patinhasLite - cost };
        } else {
            if (user.patinhasBalance < chapter.price) throw new Error('Saldo insuficiente');
            await tx.user.update({ where: { id: userId }, data: { patinhasBalance: { decrement: chapter.price } } });
            await tx.unlock.create({ data: { userId, chapterId: id, type: 'PERMANENT' } });
            await tx.transaction.create({ data: { userId, type: 'SPENT_CHAPTER', amount: -chapter.price, referenceId: chapter.id } });
            return { success: true, type: 'premium', newBalance: user.patinhasBalance - chapter.price };
        }
      });
      return res.json(result);
    } catch (error: any) {
      if (error.message.includes('insuficiente')) return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: 'Erro ao processar compra' });
    }
  }

  // 3. CRIAR (Admin)
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

  // 4. DELETAR
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