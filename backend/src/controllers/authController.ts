import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

export class AuthController {
  
  // LOGIN
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

  // REGISTRO
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

  // PERFIL COMPLETO (Corrigido para trazer Inventário)
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.userId!;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          // Histórico Financeiro
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          // Histórico de Leitura
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
          // --- CORREÇÃO AQUI: Trazer o inventário junto com o perfil ---
          inventory: {
            include: {
              item: true
            }
          }
          // -------------------------------------------------------------
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
}