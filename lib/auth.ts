import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'your-secret-key-here'
)

const alg = 'HS256'

export async function verifyAuth(token: string) {
    try {
        const verified = await jwtVerify(token, secret)
        return verified.payload
    } catch (error) {
        throw new Error('Invalid token')
    }
}

export async function generateToken(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret)
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