import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    const isOnboardingPage = request.nextUrl.pathname === '/auth/onboarding'

    // Verify authentication
    const verifiedToken = token && await verifyAuth(token).catch(() => null)
    const isAuthenticated = !!verifiedToken

    // Redirect to sign in if accessing protected routes while not authenticated
    if (!isAuthenticated && !isAuthPage) {
        const redirectUrl = new URL('/auth/signin', request.url)
        redirectUrl.searchParams.set('from', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Redirect to dashboard if accessing auth pages while authenticated
    if (isAuthenticated && isAuthPage && !isOnboardingPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // Prevent direct access to onboarding without signup
    if (isOnboardingPage && !request.cookies.get('hasCompletedSignup')) {
        return NextResponse.redirect(new URL('/auth/signup', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 