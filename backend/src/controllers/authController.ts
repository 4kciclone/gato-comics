import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken } from '../utils/jwt';
import { sendResetEmail } from '../utils/mailer';

const prisma = new PrismaClient();

export class AuthController {
  
  // ==========================================
  // LOGIN
  // ==========================================
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        return res.status(401).json({ error: 'Email não encontrado' });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      const token = generateToken(user.id, user.role);
      const { passwordHash, ...userData } = user;
      
      return res.json({ user: userData, token });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro interno no login' });
    }
  }

  // ==========================================
  // REGISTRO
  // ==========================================
  async register(req: Request, res: Response) {
    try {
      const { fullName, email, password } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          fullName,
          email,
          passwordHash,
          patinhasBalance: 5,
          role: 'USER'
        }
      });

      const token = generateToken(user.id, user.role);
      const { passwordHash: _, ...userData } = user;

      return res.status(201).json({ user: userData, token });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar conta' });
    }
  }

  // ==========================================
  // PERFIL (Com Inventário)
  // ==========================================
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          unlocks: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              chapter: {
                include: {
                  work: {
                    select: { title: true, coverUrl: true, slug: true }
                  }
                }
              }
            }
          },
          inventory: {
            include: {
              item: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const { passwordHash, ...profileData } = user;
      
      return res.json(profileData);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }

  // ==========================================
  // NOVO: BUSCAR UNLOCKS DO USUÁRIO
  // ==========================================
  async getMyUnlocks(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      
      console.log(`[Auth] Buscando unlocks do usuário ${userId}`);
      
      const now = new Date();
      
      // Busca todos os unlocks válidos (não expirados)
      const unlocks = await prisma.unlock.findMany({
        where: {
          userId: userId,
          OR: [
            { expiresAt: null },           // Permanente (PREMIUM)
            { expiresAt: { gt: now } }     // Temporário válido (LITE)
          ]
        },
        include: {
          chapter: {
            select: {
              id: true,
              workId: true,
              number: true,
              price: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`[Auth] ✅ Encontrados ${unlocks.length} unlocks válidos`);
      
      // Formata os dados para o frontend
      const formattedUnlocks = unlocks.map(unlock => ({
        workId: unlock.chapter.workId,
        chapterId: unlock.chapterId,
        chapterNumber: unlock.chapter.number,
        chapterTitle: unlock.chapter.title,
        type: unlock.type,
        unlockedAt: unlock.createdAt,
        expiresAt: unlock.expiresAt,
        pricePaid: unlock.chapter.price
      }));
      
      return res.json({
        success: true,
        unlocks: formattedUnlocks,
        total: formattedUnlocks.length
      });
      
    } catch (error) {
      console.error('[Auth] ❌ Erro ao buscar unlocks:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao buscar capítulos desbloqueados' 
      });
    }
  }

  // ==========================================
  // ESQUECI A SENHA (Envia Email)
  // ==========================================
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.json({ message: 'Se o email existir, um link foi enviado.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      now.setHours(now.getHours() + 1);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExpiry: now
        }
      });

      await sendResetEmail(user.email, token);

      return res.json({ message: 'Email enviado.' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  }

  // ==========================================
  // REDEFINIR SENHA (Salva Nova Senha)
  // ==========================================
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Token inválido ou expirado.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      return res.json({ success: true, message: 'Senha alterada com sucesso.' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  }
}