// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, SECRET, {
    expiresIn: '7d', // Token dura 7 dias
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET);
};