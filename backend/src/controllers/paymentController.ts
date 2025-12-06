import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export class PaymentController {

  // Helper para pegar a chave do Stripe
  private async getStripeClient() {
    const config = await prisma.systemConfig.findUnique({ where: { key: 'stripeSecretKey' } });
    const secretKey = config?.value || process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) throw new Error('Chave do Stripe não configurada');
    
    // FIX: Usamos 'as any' para evitar erro de versão do TypeScript quando a lib atualiza
    return new Stripe(secretKey, { apiVersion: '2024-11-20' as any });
  }

  // 1. CRIAR SESSÃO DE CHECKOUT
  async createCheckoutSession(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { packId } = req.body;

      const stripe = await this.getStripeClient();

      const pack = await prisma.patinhaPack.findUnique({ where: { id: packId } });
      if (!pack) return res.status(404).json({ error: 'Pacote não encontrado' });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: pack.name,
                description: `${pack.patinhas} Patinhas + ${pack.bonus} Bônus`,
              },
              unit_amount: Number(pack.price) * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId,
          packId: pack.id
        },
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loja?success=true`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loja?canceled=true`,
      });

      return res.json({ url: session.url });

    } catch (error) {
      console.error("Erro no checkout:", error);
      return res.status(500).json({ error: 'Erro ao iniciar pagamento' });
    }
  }

  // 2. WEBHOOK
  async handleWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; 
      if (!webhookSecret || !sig) throw new Error('Configuração de Webhook ausente');

      const stripe = await this.getStripeClient();
      
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const packId = session.metadata?.packId;

        if (userId && packId) {
          await this.fulfillOrder(userId, packId, session.id);
        }
      }

      res.json({ received: true });

    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  private async fulfillOrder(userId: string, packId: string, transactionId: string) {
    const pack = await prisma.patinhaPack.findUnique({ where: { id: packId } });
    if (!pack) return;

    const totalPatinhas = pack.patinhas + pack.bonus;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { patinhasBalance: { increment: totalPatinhas } }
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'PURCHASE_PACK',
          amount: totalPatinhas,
          description: `Compra Stripe: ${pack.name}`,
          referenceId: transactionId
        }
      })
    ]);
    
    console.log(`💰 Sucesso! ${totalPatinhas} patinhas adicionadas ao usuário ${userId}`);
  }
}
