import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CosmeticController {
  
  // 1. [ADMIN] CRIAR ITEM
  async create(req: Request, res: Response) {
    try {
      const { name, description, type, price, previewUrl, cssClass, isAnimated } = req.body;
      const item = await prisma.shopItem.create({
        data: { name, description, type, price: Number(price), previewUrl, cssClass, isAnimated }
      });
      return res.status(201).json(item);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar item' });
    }
  }

  // 2. [LOJA] LISTAR ITENS DISPONÍVEIS
  async listStore(req: Request, res: Response) {
    try {
      // Retorna todos os itens
      // (Futuro: filtrar itens que o usuário já tem, mas o front pode tratar isso)
      const items = await prisma.shopItem.findMany({ orderBy: { price: 'asc' } });
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar loja' });
    }
  }

  // 3. [USUÁRIO] COMPRAR ITEM
  async buy(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { itemId } = req.body;

      return await prisma.$transaction(async (tx) => {
        // Verifica Item
        const item = await tx.shopItem.findUnique({ where: { id: itemId } });
        if (!item) throw new Error('Item não existe');

        // Verifica se já tem
        const owned = await tx.userItem.findFirst({ where: { userId, itemId } });
        if (owned) throw new Error('Você já possui este item');

        // Verifica Saldo
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.patinhasBalance < item.price) throw new Error('Saldo insuficiente');

        // Debita
        await tx.user.update({
          where: { id: userId },
          data: { patinhasBalance: { decrement: item.price } }
        });

        // Adiciona ao Inventário
        await tx.userItem.create({
          data: { userId, itemId }
        });

        // Auditoria
        await tx.transaction.create({
          data: {
            userId,
            type: 'SPENT_CHAPTER', // Reusando tipo ou criar SPENT_SHOP
            amount: -item.price,
            description: `Compra Cosmético: ${item.name}`
          }
        });

        return { success: true, newBalance: user.patinhasBalance - item.price };
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro na compra' });
    }
  }

  // 4. [USUÁRIO] LISTAR INVENTÁRIO
  async getInventory(req: Request, res: Response) {
    try {
      const items = await prisma.userItem.findMany({
        where: { userId: req.userId! },
        include: { item: true }
      });
      return res.json(items);
    } catch (error) {
      return res.status(500).json({ error: 'Erro inventário' });
    }
  }

  // 5. [USUÁRIO] EQUIPAR ITEM
  async equip(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { userItemId } = req.body; // ID da relação UserItem

      // Busca o item para saber o tipo (BANNER, FRAME, etc)
      const targetItem = await prisma.userItem.findUnique({ 
        where: { id: userItemId },
        include: { item: true }
      });

      if (!targetItem || targetItem.userId !== userId) {
        return res.status(403).json({ error: 'Item inválido' });
      }

      // Desequipa todos os itens do mesmo tipo deste usuário
      await prisma.userItem.updateMany({
        where: { 
          userId, 
          item: { type: targetItem.item.type }, // Mesmo tipo
          isEquipped: true
        },
        data: { isEquipped: false }
      });

      // Equipa o novo
      await prisma.userItem.update({
        where: { id: userItemId },
        data: { isEquipped: true }
      });

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao equipar' });
    }
  }
}