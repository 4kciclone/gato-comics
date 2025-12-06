import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WorkController {
  
  // ==========================================
  // 1. LEITURA E DESCOBERTA (Público)
  // ==========================================

  // LISTAR OBRAS (Com Busca e Contagem)
  async list(req: Request, res: Response) {
    try {
      const { q } = req.query; // Termo de busca ?q=naruto

      const whereClause: any = {};
      
      // Se tiver busca, filtra por título ou descrição
      if (q) {
        whereClause.OR = [
          { title: { contains: String(q), mode: 'insensitive' } },
          { description: { contains: String(q), mode: 'insensitive' } }
        ];
      }

      const works = await prisma.work.findMany({
        where: whereClause,
        select: {
          id: true, 
          title: true, 
          slug: true, 
          coverUrl: true, 
          status: true, 
          rating: true,
          _count: { 
            select: { chapters: true } 
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      return res.json(works);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar obras' });
    }
  }

  // OBTER DESTAQUE (Para o Hero da Home)
  async getFeatured(req: Request, res: Response) {
    try {
      const work = await prisma.work.findFirst({
        where: {
            status: 'ONGOING'
        },
        orderBy: { updatedAt: 'desc' }, // A mais recente
        include: {
            _count: { select: { chapters: true } }
        }
      });
      
      return res.json(work || null);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar destaque' });
    }
  }

  // DETALHES DA OBRA (Por ID ou Slug)
  async show(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const work = await prisma.work.findFirst({ 
        where: { OR: [{ id }, { slug: id }] }, 
        include: { 
          chapters: {
            orderBy: { number: 'asc' },
            select: { 
              id: true, 
              number: true, 
              title: true, 
              isFree: true, 
              price: true, 
              createdAt: true 
            }
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

  // REGISTRAR VISUALIZAÇÃO
  async registerView(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Incrementa o contador geral E cria o histórico
      await prisma.$transaction([
        prisma.work.update({
          where: { id },
          data: { views: { increment: 1 } }
        }),
        prisma.workView.create({
          data: { workId: id }
        })
      ]);

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao registrar view' });
    }
  }

  // OBTER RANKING (Diário, Semanal, Geral)
  async getRanking(req: Request, res: Response) {
    try {
      const { period } = req.query; // 'daily', 'weekly', 'all'

      if (period === 'all') {
        const works = await prisma.work.findMany({
          take: 10,
          orderBy: { views: 'desc' },
          select: { id: true, title: true, coverUrl: true, views: true, rating: true, tags: true }
        });
        return res.json(works);
      }

      const now = new Date();
      let startDate = new Date();

      if (period === 'daily') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      }

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
      return res.status(500).json({ error: 'Erro ao buscar ranking' });
    }
  }

  // ==========================================
  // 3. INTERAÇÃO DO USUÁRIO (Favoritos/Notas)
  // ==========================================

  // OBTER INTERAÇÃO (Se já favoritou/deu nota)
  async getUserInteraction(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const interaction = await prisma.userLibrary.findUnique({
        where: { userId_workId: { userId, workId: id } }
      });

      return res.json(interaction || { status: 'NENHUM', rating: 0, isFavorite: false });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar status' });
    }
  }

  // ATUALIZAR INTERAÇÃO
  async updateInteraction(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { status, rating, isFavorite } = req.body;

      // 1. Atualiza/Cria na biblioteca do usuário
      const interaction = await prisma.userLibrary.upsert({
        where: { userId_workId: { userId, workId: id } },
        update: {
          ...(status && { status }),
          ...(rating !== undefined && { rating }),
          ...(isFavorite !== undefined && { isFavorite })
        },
        create: {
          userId,
          workId: id,
          status: status || 'NENHUM',
          rating: rating || null,
          isFavorite: isFavorite || false
        }
      });

      // 2. Se mudou a nota, recalcula a média da obra
      if (rating !== undefined) {
        const aggregations = await prisma.userLibrary.aggregate({
          where: { workId: id, rating: { not: null } },
          _avg: { rating: true }
        });

        const newAverage = aggregations._avg.rating || 0;

        await prisma.work.update({
          where: { id },
          data: { rating: newAverage }
        });
      }

      return res.json(interaction);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar interação' });
    }
  }

  // ==========================================
  // 4. GESTÃO DE OBRAS (Admin/Uploader)
  // ==========================================

  // CRIAR OBRA
  async create(req: Request, res: Response) {
    try {
      const { title, description, coverUrl, author, artist, tags } = req.body;
      
      const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

      const exists = await prisma.work.findUnique({ where: { slug } });
      if (exists) return res.status(400).json({ error: 'Já existe uma obra com este título' });

      const work = await prisma.work.create({
        data: { 
          title, 
          slug, 
          description, 
          coverUrl, 
          author, 
          artist, 
          tags: tags || [], 
          status: 'ONGOING' 
        }
      });
      return res.status(201).json(work);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar obra' });
    }
  }

  // ATUALIZAR OBRA
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, coverUrl, author, artist, tags, status } = req.body;

      const work = await prisma.work.update({
        where: { id },
        data: { title, description, coverUrl, author, artist, tags, status }
      });

      return res.json(work);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar obra' });
    }
  }

  // DELETAR OBRA
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Apaga dependências para evitar erro de Foreign Key
      // (Nota: Idealmente usar onDelete: Cascade no Prisma, mas fazendo manual por segurança)
      await prisma.chapter.deleteMany({ where: { workId: id } });
      await prisma.subscriptionSelection.deleteMany({ where: { workId: id } });
      await prisma.workView.deleteMany({ where: { workId: id } });
      await prisma.userLibrary.deleteMany({ where: { workId: id } });
      await prisma.comment.deleteMany({ where: { workId: id } });
      
      // Apaga a Obra
      await prisma.work.delete({ where: { id } });

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar obra' });
    }
  }
}