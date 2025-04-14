import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

// Use environment variable or fallback to a default (for development only)
const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key-here'
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

        return await decrypt(token);
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

export async function getUserCompanyId() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
        return null
    }

    try {
        const payload = await verifyAuth(token)

        if (!payload || !payload.email || typeof payload.email !== 'string') {
            return null
        }

        const user = await prisma.user.findUnique({
            where: { email: payload.email },
            select: { companyId: true },
        })

        if (!user?.companyId) {
            return null
        }

        return user.companyId
    } catch (error) {
        console.error('Error getting user company ID:', error)
        return null
    }
}