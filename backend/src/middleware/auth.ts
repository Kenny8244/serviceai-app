import { Response, NextFunction, RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt';
import { findUserById } from '../utils/database';
import { AuthenticatedRequest, JWTPayload } from '../types';

export type { AuthenticatedRequest };

export const authenticateToken: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Verify user still exists
  const user = findUserById(payload.userId);
  if (!user) {
    return res.status(403).json({ error: 'User not found' });
  }

  // Include organization ID in the user object
  req.user = {
    id: payload.userId,
    email: payload.email,
    organizationId: payload.organizationId
  };
  next();
};
