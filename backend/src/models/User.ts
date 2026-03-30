export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  jobTitle?: string | null;
  companySize?: string | null;
  industry?: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  jobTitle?: string;
  companySize?: string;
  industry?: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
  expiresAt: Date;
}

