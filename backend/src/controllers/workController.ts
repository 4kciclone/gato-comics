import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken'; // Necessário para decodificar o token manualmente na rota híbrida

const prisma = new PrismaClient();

export class WorkController {
  
  // ==========================================
  // 1. LEITURA E DESCOBERTA (Público/Híbrido)
  // ==========================================

  // LISTAR OBRAS (Com Busca)
  async list(req: Request, res: Response) {
    try {
      const { q } = req.query; 

      const whereClause: any = {};
      
      if (q) {
        whereClause.OR = [
          { title: { contains: String(q), mode: 'insensitive' } },
          { description: { contains: String(q), mode: 'insensitive' } }
        ];
      }

      const works = await prisma.work.findMany({
        where: whereClause,
        select: {
          id: true, title: true, slug: true, coverUrl: true, status: true, rating: true,
          _count: { select: { chapters: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
      return res.json(works);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar obras' });
    }
  }

  // OBTER DESTAQUE (Hero)
  async getFeatured(req: Request, res: Response) {
    try {
      const work = await prisma.work.findFirst({
        where: { status: 'ONGOING' },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { chapters: true } } }
      });
      return res.json(work || null);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar destaque' });
    }
  }

  // RECOMENDAÇÕES (Inteligente)
  async getRecommendations(req: Request, res: Response) {
    try {
      let userId = null;

      // Tenta extrair o token manualmente para personalizar (Soft Auth)
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
          userId = decoded.id;
        } catch (e) {
          // Token inválido ou expirado, segue como visitante
        }
      }

      let recommendedWorks: any[] = [];

      // 1. LÓGICA PERSONALIZADA (Se logado)
      if (userId) {
        // Busca obras que o usuário interagiu (Library)
        const userLibrary = await prisma.userLibrary.findMany({
            where: { userId },
            include: { work: { select: { tags: true, id: true } } },
            take: 10
        });

        if (userLibrary.length > 0) {
            // Pega tags preferidas
            const tags = Array.from(new Set(userLibrary.flatMap(ul => ul.work.tags)));
            const readIds = userLibrary.map(ul => ul.work.id);

            // Busca obras similares não lidas
            recommendedWorks = await prisma.work.findMany({
                where: {
                    tags: { hasSome: tags },
                    id: { notIn: readIds },
                    status: 'ONGOING'
                },
                take: 8,
                orderBy: { rating: 'desc' },
                select: {
                    id: true, title: true, coverUrl: true, rating: true, status: true,
                    _count: { select: { chapters: true } }
                }
            });
        }
      }

      // 2. FALLBACK (Populares/Recentes)
      // Se não logou ou não achou recomendações baseadas em tags
      if (recommendedWorks.length === 0) {
        recommendedWorks = await prisma.work.findMany({
           where: { status: 'ONGOING' },
           take: 8,
           orderBy: { views: 'desc' }, // As mais vistas
           select: {
                id: true, title: true, coverUrl: true, rating: true, status: true,
                _count: { select: { chapters: true } }
            }
        });
      }

      return res.json(recommendedWorks);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao gerar recomendações' });
    }
  }

  // DETALHES DA OBRA
  async show(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const work = await prisma.work.findFirst({ 
        where: { OR: [{ id }, { slug: id }] }, 
        include: { 
          chapters: {
            orderBy: { number: 'asc' },
            select: { id: true, number: true, title: true, isFree: true, price: true, createdAt: true }
          } 
        } 
      });
      if (!work) return res.status(404).json({ error: 'Obra nao encontrada' });
      return res.json(work);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
  }

  // ==========================================
  // 2. ANALYTICS E RANKING
  // ==========================================

  async registerView(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.$transaction([
        prisma.work.update({ where: { id }, data: { views: { increment: 1 } } }),
        prisma.workView.create({ data: { workId: id } })
      ]);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro view' });
    }
  }

  async getRanking(req: Request, res: Response) {
    try {
      const { period } = req.query;

      if (period === 'all') {
        const works = await prisma.work.findMany({
          take: 10, orderBy: { views: 'desc' },
          select: { id: true, title: true, coverUrl: true, views: true, rating: true, tags: true }
        });
        return res.json(works);
      }

      const now = new Date();
      let startDate = new Date();
      if (period === 'daily') startDate.setHours(0, 0, 0, 0);
      else if (period === 'weekly') startDate.setDate(now.getDate() - 7);

      const groupedViews = await prisma.workView.groupBy({
        by: ['workId'],
        where: { viewedAt: { gte: startDate } },
        _count: { workId: true },
        orderBy: { _count: { workId: 'desc' } },
        take: 10
      });

      const worksWithDetails = await Promise.all(groupedViews.map(async (item) => {
        const work = await prisma.work.findUnique({
          where: { id: item.workId },
          select: { id: true, title: true, coverUrl: true, rating: true, tags: true }
        });
        return { ...work, views: item._count.workId };
      }));

      return res.json(worksWithDetails);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ranking' });
    }
  }

  // ==========================================
  // 3. INTERAÇÃO DO USUÁRIO
  // ==========================================

  async getUserInteraction(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const interaction = await prisma.userLibrary.findUnique({
        where: { userId_workId: { userId, workId: id } }
      });
      return res.json(interaction || { status: 'NENHUM', rating: 0, isFavorite: false });
    } catch (error) {
      return res.status(500).json({ error: 'Erro status' });
    }
  }

  async updateInteraction(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { status, rating, isFavorite } = req.body;

      const interaction = await prisma.userLibrary.upsert({
        where: { userId_workId: { userId, workId: id } },
        update: { ...(status && { status }), ...(rating !== undefined && { rating }), ...(isFavorite !== undefined && { isFavorite }) },
        create: { userId, workId: id, status: status || 'NENHUM', rating: rating || null, isFavorite: isFavorite || false }
      });

      if (rating !== undefined) {
        const aggregations = await prisma.userLibrary.aggregate({
          where: { workId: id, rating: { not: null } },
          _avg: { rating: true }
        });
        await prisma.work.update({ where: { id }, data: { rating: aggregations._avg.rating || 0 } });
      }

      return res.json(interaction);
    } catch (error) {
      return res.status(500).json({ error: 'Erro update' });
    }
  }

  // ==========================================
  // 4. GESTÃO (Admin)
  // ==========================================

  async create(req: Request, res: Response) {
    try {
      const { title, description, coverUrl, author, artist, tags } = req.body;
      const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const exists = await prisma.work.findUnique({ where: { slug } });
      if (exists) return res.status(400).json({ error: 'Título já existe' });

      const work = await prisma.work.create({
        data: { title, slug, description, coverUrl, author, artist, tags: tags || [], status: 'ONGOING' }
      });
      return res.status(201).json(work);
    } catch (error) { return res.status(500).json({ error: 'Erro create' }); }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, coverUrl, author, artist, tags, status } = req.body;
      const work = await prisma.work.update({
        where: { id },
        data: { title, description, coverUrl, author, artist, tags, status }
      });
      return res.json(work);
    } catch (error) { return res.status(500).json({ error: 'Erro update' }); }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.chapter.deleteMany({ where: { workId: id } });
      await prisma.subscriptionSelection.deleteMany({ where: { workId: id } });
      await prisma.workView.deleteMany({ where: { workId: id } });
      await prisma.userLibrary.deleteMany({ where: { workId: id } });
      await prisma.comment.deleteMany({ where: { workId: id } });
      await prisma.work.delete({ where: { id } });
      return res.json({ success: true });
    } catch (error) { return res.status(500).json({ error: 'Erro delete' }); }
  }
}