import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        // Edge Runtime doesn't like Promise.race with setTimeout
        // So we'll just directly decrypt the token with proper error handling
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

export function setAuthCookie(token: string) {
    cookies().set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    })
}

export function removeAuthCookie() {
    cookies().delete('token')
}

// Helper function to check user authorization and get company ID
export async function getUserCompanyId(): Promise<string> {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        throw new Error('Unauthorized');
    }

    const payload = await verifyAuth(token);

    if (!payload?.email || typeof payload.email !== 'string') {
        throw new Error('Invalid token');
    }

    const user = await prisma.user.findUnique({
        where: { email: payload.email },
        include: { company: true }
    });

    if (!user?.companyId) {
        throw new Error('Company not found');
    }

    return user.companyId;
}

