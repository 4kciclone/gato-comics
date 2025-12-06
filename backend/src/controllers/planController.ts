import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PlanController {
  async list(req: Request, res: Response) {
    try {
      // Busca planos ordenados por preço
      const plans = await prisma.plan.findMany({
        orderBy: { price: 'asc' }
      });
      return res.json(plans);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar planos' });
    }
  }
}