// backend/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

// Extender o tipo Request do Express para incluir o user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  // O formato é "Bearer <token>"
  const parts = authorization.split(' ');

  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro no Token' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as TokenPayload;
    
    // Salva o ID do usuário na requisição para usar depois
    req.userId = decoded.id;
    req.userRole = decoded.role;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}