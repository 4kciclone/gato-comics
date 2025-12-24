import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class WorkController {
  
  // ==========================================
  // 1. LEITURA E DESCOBERTA (Público/Híbrido)
  // ==========================================

  // LISTAR OBRAS (Com Busca)
  async list(req: Request, res: Response) {
    try {
      // Evita cache na listagem para refletir status novos rapidamente
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

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
      console.error('[WorkController] Erro ao listar obras:', error);
      return res.status(500).json({ error: 'Erro ao buscar obras' });
    }
  }

  // OBTER DESTAQUE (Hero)
  async getFeatured(req: Request, res: Response) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');

      const work = await prisma.work.findFirst({
        where: { status: 'ONGOING' },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { chapters: true } } }
      });
      
      return res.json(work || null);
    } catch (error) {
      console.error('[WorkController] Erro ao buscar destaque:', error);
      return res.status(500).json({ error: 'Erro ao buscar destaque' });
    }
  }

  // RECOMENDAÇÕES (Inteligente)
  async getRecommendations(req: Request, res: Response) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');

      let userId = null;

      // Soft Auth
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
          if (token && token !== 'null' && token !== 'undefined') {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            userId = decoded.id;
          }
        } catch (e) { 
          console.log('[WorkController] Token inválido em recomendações');
        }
      }

      let recommendedWorks: any[] = [];

      // 1. Lógica Personalizada (Se logado)
      if (userId) {
        const userLibrary = await prisma.userLibrary.findMany({
            where: { userId },
            include: { work: { select: { tags: true, id: true } } },
            take: 10
        });

        if (userLibrary.length > 0) {
            const tags = Array.from(new Set(userLibrary.flatMap(ul => ul.work.tags)));
            const readIds = userLibrary.map(ul => ul.work.id);

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

      // 2. Fallback (Populares)
      if (recommendedWorks.length === 0) {
        recommendedWorks = await prisma.work.findMany({
           where: { status: 'ONGOING' },
           take: 8,
           orderBy: { views: 'desc' },
           select: {
                id: true, title: true, coverUrl: true, rating: true, status: true,
                _count: { select: { chapters: true } }
            }
        });
      }

      return res.json(recommendedWorks);

    } catch (error) {
      console.error('[WorkController] Erro ao gerar recomendações:', error);
      return res.status(500).json({ error: 'Erro ao gerar recomendações' });
    }
  }

  // =========================================================================
  // 3. DETALHES DA OBRA (COM CORREÇÃO DE CACHE E VERIFICAÇÃO DE UNLOCKS)
  // =========================================================================
  async show(req: Request, res: Response) {
    const { id } = req.params;
    let userId: string | null = null;

    // A. Desativar Cache do Navegador (CRUCIAL para atualizar após compra)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // B. Soft Auth: Identificar usuário
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        if (token && token !== 'null' && token !== 'undefined') {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            userId = decoded.id;
        }
      } catch (e: any) { 
        console.log(`[WorkController] Token inválido: ${e.message}`);
      }
    }

    console.log(`\n=== GET WORK DETAILS ===`);
    console.log(`Work ID: ${id}`);
    console.log(`User ID: ${userId || 'VISITANTE'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    try {
      // C. Buscar a Obra
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
      
      if (!work) {
        console.log(`[WorkController] Obra não encontrada: ${id}`);
        return res.status(404).json({ error: 'Obra não encontrada' });
      }

      console.log(`Obra: ${work.title}`);
      console.log(`Total de capítulos: ${work.chapters.length}`);

      // D. Mapa de Desbloqueios
      const unlockedMap: Record<string, boolean> = {};

      if (userId) {
        // Busca unlocks para os capítulos desta obra específica
        const chapterIds = work.chapters.map(c => c.id);
        
        const unlocks = await prisma.unlock.findMany({
            where: {
                userId: userId,
                chapterId: { in: chapterIds }
            },
            select: { 
              chapterId: true, 
              expiresAt: true, 
              type: true,
              createdAt: true 
            }
        });

        console.log(`\n--- UNLOCKS ENCONTRADOS: ${unlocks.length} ---`);

        const now = new Date();
        
        unlocks.forEach((unlock, index) => {
            const isExpired = unlock.expiresAt && new Date(unlock.expiresAt) <= now;
            const isValid = !unlock.expiresAt || new Date(unlock.expiresAt) > now;
            
            const chapterNumber = work.chapters.find(c => c.id === unlock.chapterId)?.number || '?';
            
            console.log(`\nUnlock ${index + 1}:`);
            console.log(`  ├─ Capítulo: ${chapterNumber}`);
            console.log(`  ├─ Tipo: ${unlock.type}`);
            console.log(`  ├─ Comprado em: ${unlock.createdAt.toISOString()}`);
            console.log(`  ├─ Expira: ${unlock.expiresAt ? unlock.expiresAt.toISOString() : 'NUNCA'}`);
            console.log(`  ├─ Status: ${isValid ? '✓ VÁLIDO' : '✗ EXPIRADO'}`);
            
            if (isValid) {
                unlockedMap[unlock.chapterId] = true;
            }
        });

        console.log(`\n--- RESUMO ---`);
        console.log(`Capítulos desbloqueados no mapa: ${Object.keys(unlockedMap).length}`);
      } else {
        console.log(`\nUsuário não autenticado - sem unlocks`);
      }

      // E. Monta resposta injetando status
      const chaptersWithStatus = work.chapters.map(chapter => {
          const isFreeChapter = chapter.isFree || chapter.price === 0;
          const hasUnlock = !!unlockedMap[chapter.id];
          const isUnlocked = isFreeChapter || hasUnlock;
          
          if (isUnlocked) {
            console.log(`Cap ${chapter.number}: DESBLOQUEADO (Free: ${isFreeChapter}, Unlock: ${hasUnlock})`);
          }
          
          return {
              ...chapter,
              isUnlocked
          };
      });

      const unlockedCount = chaptersWithStatus.filter(c => c.isUnlocked).length;
      console.log(`\nRESPOSTA FINAL: ${unlockedCount}/${work.chapters.length} capítulos desbloqueados`);
      console.log(`========================\n`);

      return res.json({ ...work, chapters: chaptersWithStatus });

    } catch (error) {
      console.error('[WorkController] Erro ao buscar detalhes:', error);
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
      console.error('[WorkController] Erro ao registrar view:', error);
      return res.status(500).json({ error: 'Erro ao registrar visualização' });
    }
  }

  async getRanking(req: Request, res: Response) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      
      const { period } = req.query;

      if (period === 'all') {
        const works = await prisma.work.findMany({
          take: 10, 
          orderBy: { views: 'desc' },
          select: { 
            id: true, 
            title: true, 
            coverUrl: true, 
            views: true, 
            rating: true, 
            tags: true 
          }
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
          select: { 
            id: true, 
            title: true, 
            coverUrl: true, 
            rating: true, 
            tags: true 
          }
        });
        return { ...work, views: item._count.workId };
      }));

      return res.json(worksWithDetails);
    } catch (error) {
      console.error('[WorkController] Erro ao buscar ranking:', error);
      return res.status(500).json({ error: 'Erro ao buscar ranking' });
    }
  }

  // ==========================================
  // 3. INTERAÇÃO DO USUÁRIO
  // ==========================================

  async getUserInteraction(req: Request, res: Response) {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      
      const userId = req.userId!;
      const { id } = req.params;
      
      const interaction = await prisma.userLibrary.findUnique({
        where: { userId_workId: { userId, workId: id } }
      });
      
      return res.json(interaction || { 
        status: 'NENHUM', 
        rating: 0, 
        isFavorite: false 
      });
    } catch (error) {
      console.error('[WorkController] Erro ao buscar interação:', error);
      return res.status(500).json({ error: 'Erro ao buscar status' });
    }
  }

  async updateInteraction(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { status, rating, isFavorite } = req.body;

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

      // Atualiza rating médio da obra
      if (rating !== undefined) {
        const aggregations = await prisma.userLibrary.aggregate({
          where: { workId: id, rating: { not: null } },
          _avg: { rating: true }
        });
        
        await prisma.work.update({ 
          where: { id }, 
          data: { rating: aggregations._avg.rating || 0 } 
        });
      }

      return res.json(interaction);
    } catch (error) {
      console.error('[WorkController] Erro ao atualizar interação:', error);
      return res.status(500).json({ error: 'Erro ao atualizar interação' });
    }
  }

  // ==========================================
  // 4. GESTÃO (Admin)
  // ==========================================

  async create(req: Request, res: Response) {
    try {
      const { title, description, coverUrl, author, artist, tags } = req.body;
      
      const slug = title
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
      
      const exists = await prisma.work.findUnique({ where: { slug } });
      
      if (exists) {
        return res.status(400).json({ error: 'Título já existe' });
      }

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
      
      console.log(`[WorkController] Obra criada: ${work.title}`);
      return res.status(201).json(work);
    } catch (error) {
      console.error('[WorkController] Erro ao criar obra:', error);
      return res.status(500).json({ error: 'Erro ao criar obra' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, coverUrl, author, artist, tags, status } = req.body;
      
      const work = await prisma.work.update({
        where: { id },
        data: { title, description, coverUrl, author, artist, tags, status }
      });
      
      console.log(`[WorkController] Obra atualizada: ${work.title}`);
      return res.json(work);
    } catch (error) {
      console.error('[WorkController] Erro ao atualizar obra:', error);
      return res.status(500).json({ error: 'Erro ao atualizar obra' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Deletar tudo relacionado primeiro
      await prisma.$transaction([
        prisma.chapter.deleteMany({ where: { workId: id } }),
        prisma.subscriptionSelection.deleteMany({ where: { workId: id } }),
        prisma.workView.deleteMany({ where: { workId: id } }),
        prisma.userLibrary.deleteMany({ where: { workId: id } }),
        prisma.comment.deleteMany({ where: { workId: id } }),
        prisma.work.delete({ where: { id } })
      ]);
      
      console.log(`[WorkController] Obra deletada: ${id}`);
      return res.json({ success: true });
    } catch (error) {
      console.error('[WorkController] Erro ao deletar obra:', error);
      return res.status(500).json({ error: 'Erro ao deletar obra' });
    }
  }
}