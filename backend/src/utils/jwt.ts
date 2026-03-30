import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const generateToken = (payload: Omit<JWTPayload, 'organizationId'> & { organizationId?: string }): string => {
  return jwt.sign({
    userId: payload.userId,
    email: payload.email,
    organizationId: payload.organizationId || 'default-org-id'
  }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId || 'default-org-id'
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export const getTokenExpiration = (): Date => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7); // 7 days
  return expirationDate;
};
