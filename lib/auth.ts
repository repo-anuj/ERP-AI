import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

// Use environment variable or fallback to a default (for development only)
// In production, JWT_SECRET_KEY MUST be set as an environment variable
const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key-here-development-only'

if (process.env.NODE_ENV === 'production' && secretKey === 'your-secret-key-here-development-only') {
    throw new Error('JWT_SECRET_KEY environment variable must be set in production')
}

const key = new TextEncoder().encode(secretKey)

// Remove unused constant
// const alg = 'HS256'

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key)
}

export async function generateToken(payload: any) {
    return await encrypt(payload)
}

export async function decrypt(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        console.error('Failed to decrypt token:', error)
        throw new Error('Invalid token')
    }
}

export async function verifyAuth(tokenOrCookies: string | ReadonlyRequestCookies) {
    try {
        let token: string;

        // Check if we received cookies object or token string
        if (typeof tokenOrCookies === 'string') {
            token = tokenOrCookies;
        } else {
            // It's a cookies object
            const cookieToken = tokenOrCookies.get('token')?.value;
            if (!cookieToken) return null;
            token = cookieToken;
        }

        // Edge Runtime compatible token verification
        try {
            return await decrypt(token);
        } catch (decryptError) {
            console.error('Token decryption failed:', decryptError);
            return null;
        }
    } catch (error) {
        console.error('Failed to verify token:', error);
        return null;
    }
}

// Edge Runtime compatible version for middleware
export async function verifyAuthEdge(token: string) {
    try {
        const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key-here-development-only'
        const key = new TextEncoder().encode(secretKey)

        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        })
        return payload
    } catch (error) {
        console.error('Edge token verification error:', error)
        return null
    }
}

export async function setAuthCookie(token: string) {
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    })
}

export async function removeAuthCookie() {
    const cookieStore = await cookies()
    cookieStore.delete('token')
}

/**
 * Get the current authenticated entity (user or employee) with selected fields
 */
export async function getCurrentEntity<T>(
    select: Record<string, boolean | object> = {}
): Promise<T | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true'

    if (!token) {
        return null
    }

    try {
        const payload = await verifyAuth(token)

        if (!payload) {
            return null
        }

        // Handle employee tokens
        if (isEmployee) {
            const employee = await prisma.employee.findUnique({
                where: { id: payload.id },
                select: select as any,
            })

            return employee as unknown as T
        }
        // Handle regular user tokens
        else {
            if (!payload.email || typeof payload.email !== 'string') {
                return null
            }

            const user = await prisma.user.findUnique({
                where: { email: payload.email },
                select: select as any,
            })

            return user as unknown as T
        }
    } catch (error) {
        console.error('Error getting current entity:', error)
        return null
    }
}

/**
 * Get the company ID for the current authenticated user or employee
 */
export async function getUserCompanyId(): Promise<string | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const isEmployee = cookieStore.get('isEmployee')?.value === 'true'

    if (!token) {
        return null
    }

    try {
        const payload = await verifyAuth(token)

        if (!payload) {
            return null
        }

        // Handle employee tokens
        if (isEmployee) {
            // For employees, the company ID is directly in the token payload
            if (payload.companyId) {
                return payload.companyId
            }

            // If not in the token, try to get it from the database
            const employee = await prisma.employee.findUnique({
                where: { id: payload.id },
                select: { companyId: true },
            })

            return employee?.companyId || null
        }
        // Handle regular user tokens
        else {
            if (!payload.email || typeof payload.email !== 'string') {
                return null
            }

            const user = await prisma.user.findUnique({
                where: { email: payload.email },
                select: { companyId: true },
            })

            return user?.companyId || null
        }
    } catch (error) {
        console.error('Error getting user company ID:', error)
        return null
    }
}