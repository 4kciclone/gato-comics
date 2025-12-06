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

  // 2. LISTAR COMENTÁRIOS (Hierárquico)
  async list(req: Request, res: Response) {
    try {
      const { workId, chapterId } = req.query;

      const whereClause: any = { parentId: null }; // Busca apenas os "pais" primeiro
      if (workId) whereClause.workId = String(workId);
      if (chapterId) whereClause.chapterId = String(chapterId);

      const comments = await prisma.comment.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          // Dados do Autor e seus Cosméticos
          user: {
            select: {
              id: true, fullName: true, role: true,
              inventory: {
                where: { isEquipped: true },
                include: { item: true }
              }
            }
          },
          // Buscar Respostas (Nível 1 de aninhamento)
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