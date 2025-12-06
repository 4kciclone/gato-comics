import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
  
  // 1. LISTAR USUÁRIOS
  async listUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true, fullName: true, email: true, role: true, 
          patinhasBalance: true, createdAt: true,
          _count: { select: { unlocks: true, transactions: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  }

  // 2. ATUALIZAR USUÁRIO (Cargo/Saldo)
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role, patinhasBalance } = req.body;

      const dataToUpdate: any = {};
      if (role) dataToUpdate.role = role;
      if (patinhasBalance !== undefined) dataToUpdate.patinhasBalance = patinhasBalance;

      const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate
      });

      // Auditoria se mudou saldo
      if (patinhasBalance !== undefined) {
        await prisma.transaction.create({
          data: {
            userId: id,
            type: 'ADMIN_ADJUSTMENT',
            amount: 0,
            description: `Ajuste manual de saldo pelo Admin`
          }
        });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  }

  // 3. RELATÓRIO FINANCEIRO
  async getFinance(req: Request, res: Response) {
    try {
      const transactions = await prisma.transaction.findMany({
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const totalTransactions = await prisma.transaction.count();

      return res.json({ transactions, total: totalTransactions });
    } catch (error) {
      return res.status(500).json({ error: 'Erro financeiro' });
    }
  }

  // 4. DADOS DO DASHBOARD (NOVO)
  async getDashboardStats(req: Request, res: Response) {
    try {
      // Executa várias queries em paralelo para ser rápido
      const [worksCount, usersCount, unlocksCount, transactions] = await Promise.all([
        prisma.work.count(),
        prisma.user.count(),
        prisma.unlock.count(),
        prisma.transaction.findMany({ 
          where: { type: 'PURCHASE_PACK' },
          select: { amount: true }
        })
      ]);

      // Calcula Receita Total (Soma das patinhas vendidas)
      const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);

      // Novos usuários nas últimas 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const newUsers24h = await prisma.user.count({
        where: { createdAt: { gte: yesterday } }
      });

      return res.json({
        worksCount,
        usersCount,
        unlocksCount, // Leituras/Desbloqueios
        totalRevenue,
        newUsers24h
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
  }
}