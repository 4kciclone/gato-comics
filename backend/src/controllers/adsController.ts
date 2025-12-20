import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdsController {
  
  async watchAd(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

      const now = new Date();
      const lastDate = new Date(user.lastAdDate);
      
      // Verifica se virou o dia (resetar contador)
      const isSameDay = now.getDate() === lastDate.getDate() && 
                        now.getMonth() === lastDate.getMonth() && 
                        now.getFullYear() === lastDate.getFullYear();

      let currentCount = isSameDay ? user.dailyAdCount : 0;

      // Verifica limite
      if (currentCount >= 4) {
        return res.status(400).json({ error: 'Limite diário atingido. Volte amanhã!' });
      }

      // Atualiza
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          patinhasLite: { increment: 1 },
          dailyAdCount: currentCount + 1, // Se mudou o dia, currentCount era 0, vira 1
          lastAdDate: now
        }
      });

      // Registra transação (Opcional, mas bom para histórico)
      await prisma.transaction.create({
        data: {
          userId,
          type: 'ADMIN_ADJUSTMENT', // Ou criar um tipo 'AD_REWARD'
          amount: 1,
          description: 'Recompensa de Anúncio (Lite)'
        }
      });

      return res.json({ 
        success: true, 
        patinhasLite: updatedUser.patinhasLite,
        dailyAdCount: updatedUser.dailyAdCount 
      });

    } catch (error) {
      return res.status(500).json({ error: 'Erro ao processar anúncio' });
    }
  }
}