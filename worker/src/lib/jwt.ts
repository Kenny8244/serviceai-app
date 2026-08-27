import { SignJWT, jwtVerify } from 'jose'
import type { JwtPayload } from './types'

function getSecret(env: { JWT_SECRET?: string }) {
  return new TextEncoder().encode(env.JWT_SECRET || 'serviceai-dev-secret')
}

export async function generateToken(
  env: { JWT_SECRET?: string },
  payload: Omit<JwtPayload, 'organizationId'> & { organizationId?: string }
): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    organizationId: payload.organizationId || 'default-org-id',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret(env))
}

export async function verifyToken(
  env: { JWT_SECRET?: string },
  token: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(env))
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      organizationId: (payload.organizationId as string) || 'default-org-id',
    }
  } catch {
    return null
  }
}

export function getTokenExpiration(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString()
}

export function publicUser(user: {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  jobTitle?: string
  companySize?: string
  industry?: string
  createdAt: string
  updatedAt: string
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    companyName: user.companyName,
    phoneNumber: user.phoneNumber,
    jobTitle: user.jobTitle ?? null,
    companySize: user.companySize ?? null,
    industry: user.industry ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
