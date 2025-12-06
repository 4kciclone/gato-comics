import { Request, Response, NextFunction } from 'express';

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  // O authMiddleware já rodou antes e preencheu req.userRole
  const role = req.userRole;

  if (!role) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  // Permite apenas ADMIN e OWNER (God Mode)
  if (role !== 'ADMIN' && role !== 'OWNER') {
    return res.status(403).json({ error: 'Acesso restrito a Administradores' });
  }

  return next();
}

// Bônus: Middleware para Uploader (Para criar obras)
export function uploaderMiddleware(req: Request, res: Response, next: NextFunction) {
  const role = req.userRole;
  
  const allowed = ['UPLOADER', 'ADMIN', 'OWNER'];
  
  if (!role || !allowed.includes(role)) {
    return res.status(403).json({ error: 'Acesso restrito a Criadores' });
  }

  return next();
}
