import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
}

// Vertical related interfaces
export interface UserVertical {
  id: string;
  name: string;
  // Add other vertical properties as needed
}

// Request body for selecting a vertical
export interface SelectVerticalBody {
  verticalId?: string;
}
