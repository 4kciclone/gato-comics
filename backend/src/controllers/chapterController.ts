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

      // --- CORREÇÃO: Extração de Token Mais Robusta ---
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          // Aceita "Bearer TOKEN" ou apenas "TOKEN"
          const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
          if (token && token !== 'null' && token !== 'undefined') {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            userId = decoded.id;
          }
        } catch (e) {
          console.log("Token inválido no getContent:", e);
        }
      }
      // ------------------------------------------------

      // Busca o capítulo
      const chapter = await prisma.chapter.findUnique({ 
        where: { id },
        include: { work: true } 
      });
      
      if (!chapter) return res.status(404).json({ error: 'Capítulo não encontrado' });

      // Lógica de Permissão
      let showImages = true;
      let accessType = 'FREE';

      if (!chapter.isFree && chapter.price > 0) {
        let hasAccess = false;
        if (userId) {
          const unlock = await prisma.unlock.findUnique({
            where: { userId_chapterId: { userId, chapterId: id } }
          });
          
          if (unlock) {
            // Verifica validade
            if (!unlock.expiresAt || new Date(unlock.expiresAt) > new Date()) {
                hasAccess = true;
                accessType = unlock.type; // PERMANENT ou RENTAL_AD
            } else {
                // Expirou (Lite)
                // Opcional: Deletar o unlock expirado aqui para limpar o banco
                // await prisma.unlock.delete({ where: { id: unlock.id } });
            }
          }
        }
        if (!hasAccess) showImages = false;
      }

      // Vizinhos
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

      // Checa bloqueio dos vizinhos
      const checkLock = async (chap: any) => {
        if (!chap) return null;
        if (chap.isFree || chap.price === 0) return { ...chap, isLocked: false };
        if (!userId) return { ...chap, isLocked: true };

        const unlock = await prisma.unlock.findUnique({
            where: { userId_chapterId: { userId, chapterId: chap.id } }
        });
        
        const hasAccess = unlock && (!unlock.expiresAt || new Date(unlock.expiresAt) > new Date());
        return { ...chap, isLocked: !hasAccess };
      };

      const prevInfo = await checkLock(prevChapter);
      const nextInfo = await checkLock(nextChapter);

      const responseData = { 
        title: chapter.title,
        number: chapter.number,
        prev: prevInfo, 
        next: nextInfo,
        pages: showImages ? chapter.pages : [] // Só manda páginas se tiver acesso
      };

      if (!showImages) {
        return res.status(403).json({ 
            error: 'Capítulo Bloqueado', 
            ...responseData
        });
      }

      return res.json(responseData);

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

        // Limpeza de desbloqueios expirados ou existentes
        const existingUnlock = await tx.unlock.findUnique({
          where: { userId_chapterId: { userId, chapterId: id } }
        });
        
        if (existingUnlock) {
           // Se for permanente, ou se for aluguel que AINDA vale, não cobra de novo
           if (!existingUnlock.expiresAt || new Date(existingUnlock.expiresAt) > new Date()) {
               return { success: true, message: 'Já possui acesso', alreadyOwned: true };
           }
           // Se expirou, apaga para criar o novo
           await tx.unlock.delete({ where: { id: existingUnlock.id } });
        }

        if (method === 'lite') {
            const cost = 2; 
            if (user.patinhasLite < cost) throw new Error('Saldo Lite insuficiente');

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { patinhasLite: { decrement: cost } }
            });

            await tx.unlock.create({
                data: { 
                    userId, chapterId: id, type: 'RENTAL_AD', 
                    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 Dias
                }
            });
            // Retorna os saldos ATUAIS para o front atualizar
            return { success: true, type: 'lite', newBalanceLite: updatedUser.patinhasLite, newBalancePremium: updatedUser.patinhasBalance };
        
        } else {
            if (user.patinhasBalance < chapter.price) throw new Error('Saldo insuficiente');

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { patinhasBalance: { decrement: chapter.price } }
            });

            await tx.unlock.create({ data: { userId, chapterId: id, type: 'PERMANENT' } });
            
            await tx.transaction.create({
                data: { userId, type: 'SPENT_CHAPTER', amount: -chapter.price, referenceId: chapter.id }
            });

            return { success: true, type: 'premium', newBalanceLite: updatedUser.patinhasLite, newBalancePremium: updatedUser.patinhasBalance };
        }
      });
      return res.json(result);
    } catch (error: any) {
      if (error.message.includes('insuficiente')) return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: 'Erro ao processar compra' });
    }
  }

  // ... (Create e Delete continuam iguais)
  async create(req: Request, res: Response) { try { const { workId } = req.params; const { number, title, price, pages } = req.body; const chapter = await prisma.chapter.create({ data: { workId, number: parseFloat(number), title, price: parseInt(price), isFree: parseInt(price) === 0, pages: pages || [] } }); return res.status(201).json(chapter); } catch (error) { return res.status(500).json({ error: 'Erro ao criar capítulo' }); } }
  async delete(req: Request, res: Response) { try { const { id } = req.params; await prisma.unlock.deleteMany({ where: { chapterId: id } }); await prisma.comment.deleteMany({ where: { chapterId: id } }); await prisma.chapter.delete({ where: { id } }); return res.json({ success: true }); } catch (error) { return res.status(500).json({ error: 'Erro ao deletar capítulo' }); } }
}