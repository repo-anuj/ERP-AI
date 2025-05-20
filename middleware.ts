import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple middleware to handle basic auth redirects
export async function middleware(request: NextRequest) {
    // Skip middleware for static assets and API routes
    const { pathname } = request.nextUrl;
    if (
        pathname.includes('/_next') ||
        pathname.includes('/api/') ||
        pathname.includes('/static/') ||
        pathname.includes('/images/') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg')
    ) {
        return NextResponse.next();
    }

    // Basic auth check
    const token = request.cookies.get('token')?.value
    const isAuthPage = pathname.startsWith('/auth')

    // Simple authentication check
    const isAuthenticated = !!token

    // Redirect to sign in if accessing protected routes while not authenticated
    if (!isAuthenticated && !isAuthPage) {
        const redirectUrl = new URL('/auth/signin', request.url)
        redirectUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Redirect to dashboard if accessing auth pages while authenticated
    if (isAuthenticated && isAuthPage) {
        // Skip the onboarding page check for simplicity
        if (pathname !== '/auth/onboarding') {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}