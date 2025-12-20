import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CommentController {

  // 1. CRIAR COMENTÁRIO
  async create(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { text, isSpoiler, workId, chapterId, parentId } = req.body;

      if (!text) return res.status(400).json({ error: 'Texto obrigatório' });

      const comment = await prisma.comment.create({
        data: {
          text,
          isSpoiler: !!isSpoiler,
          userId,
          workId,     // Pode ser null se for comentário de capítulo
          chapterId,  // Pode ser null se for comentário de obra
          parentId    // Null se for comentário principal
        },
        include: {
          user: {
            select: {
              id: true, fullName: true, role: true,
              // Inclui itens equipados para atualizar a UI instantaneamente
              inventory: {
                where: { isEquipped: true },
                include: { item: true }
              }
            }
          }
        }
      });

      return res.status(201).json(comment);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao comentar' });
    }
  }

  // 2. LISTAR COMENTÁRIOS (Atualizado para Comunidade)
  async list(req: Request, res: Response) {
    try {
      const { workId, chapterId, type } = req.query; // Adicionado 'type'

      let whereClause: any = { parentId: null };

      if (type === 'community') {
        // Se for comunidade, busca onde NÃO tem obra nem capítulo
        whereClause.workId = null;
        whereClause.chapterId = null;
      } else {
        // Se for obra/capítulo normal
        if (workId) whereClause.workId = String(workId);
        if (chapterId) whereClause.chapterId = String(chapterId);
      }

      const comments = await prisma.comment.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true, fullName: true, role: true,
              inventory: {
                where: { isEquipped: true },
                include: { item: true }
              }
            }
          },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true, fullName: true, role: true,
                  inventory: {
                    where: { isEquipped: true },
                    include: { item: true }
                  }
                }
              }
            }
          }
        }
      });

      return res.json(comments);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar comentários' });
    }
  }
}