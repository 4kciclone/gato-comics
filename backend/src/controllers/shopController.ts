import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ShopController {
  
  // 1. LISTAR PACOTES
  async listPacks(req: Request, res: Response) {
    try {
      // Busca os pacotes criados no seed
      const packs = await prisma.patinhaPack.findMany({
        orderBy: { price: 'asc' }
      });
      return res.json(packs);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar pacotes' });
    }
  }

  // 2. COMPRAR PACOTE (Mock de Pagamento)
  async buyPack(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { packId } = req.body;

      // Inicia Transação
      const result = await prisma.$transaction(async (tx) => {
        
        // A. Busca o pacote e o usuário
        const pack = await tx.patinhaPack.findUnique({ where: { id: packId } });
        if (!pack) throw new Error('Pacote não encontrado');

        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('Usuário inválido');

        // B. Calcula o total (Patinhas Base + Bônus)
        const totalPatinhas = pack.patinhas + pack.bonus;

        // C. Atualiza Saldo do Usuário
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { patinhasBalance: { increment: totalPatinhas } }
        });

        // D. Registra a Transação (Audit)
        await tx.transaction.create({
          data: {
            userId,
            type: 'PURCHASE_PACK',
            amount: totalPatinhas,
            description: `Compra: ${pack.name}`,
            referenceId: pack.id // Aqui iria o ID do Stripe na vida real
          }
        });

        return { 
          success: true, 
          newBalance: updatedUser.patinhasBalance,
          added: totalPatinhas 
        };
      });

      return res.json(result);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao processar compra' });
    }
  }
}