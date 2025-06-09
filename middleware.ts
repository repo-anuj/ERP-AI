import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Define department types
type DepartmentType = 'admin' | 'manager' | 'hr' | 'sales' | 'engineering' | 'finance' | 'employee';

// Define department access permissions
const departmentAccess: Record<DepartmentType, string[]> = {
  admin: ['dashboard', 'inventory', 'sales', 'hr', 'projects', 'finance', 'analytics', 'settings'],
  manager: ['dashboard', 'inventory', 'sales', 'projects', 'analytics', 'settings'],
  hr: ['hr', 'analytics', 'settings'],
  sales: ['sales', 'inventory', 'settings'],
  engineering: ['projects', 'settings'],
  finance: ['finance', 'sales', 'inventory', 'settings'],
  employee: ['settings']
}

// Define department home pages
const departmentHomePage: Record<DepartmentType, string> = {
  admin: '/',
  manager: '/',
  hr: '/hr',
  sales: '/sales',
  engineering: '/projects',
  finance: '/dashboard/finance',
  employee: '/settings'
}

// Completely isolated Edge Runtime token verification
async function verifyJWTToken(token: string) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key-here-development-only'
    const key = new TextEncoder().encode(secretKey)
    
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
    try {
        const { pathname } = request.nextUrl;
        
        // Skip middleware for static assets and API routes
        if (
            pathname.startsWith('/_next/') ||
            pathname.startsWith('/api/') ||
            pathname.startsWith('/static/') ||
            pathname.startsWith('/images/') ||
            pathname.includes('.') && (
                pathname.endsWith('.ico') ||
                pathname.endsWith('.png') ||
                pathname.endsWith('.jpg') ||
                pathname.endsWith('.jpeg') ||
                pathname.endsWith('.gif') ||
                pathname.endsWith('.svg') ||
                pathname.endsWith('.webp') ||
                pathname.endsWith('.css') ||
                pathname.endsWith('.js')
            )
        ) {
            return NextResponse.next();
        }

        const token = request.cookies.get('token')?.value
        const isAuthPage = pathname.startsWith('/auth')
        const isOnboardingPage = pathname === '/auth/onboarding'
        const isEmployee = request.cookies.get('isEmployee')?.value === 'true'

        // Verify authentication
        let verifiedToken = null
        if (token) {
            verifiedToken = await verifyJWTToken(token)
        }

        const isAuthenticated = !!verifiedToken

        // Redirect to sign in if accessing protected routes while not authenticated
        if (!isAuthenticated && !isAuthPage) {
            const redirectUrl = new URL('/auth/signin', request.url)
            redirectUrl.searchParams.set('from', pathname)
            return NextResponse.redirect(redirectUrl)
        }

        // Redirect to appropriate home page if accessing auth pages while authenticated
        if (isAuthenticated && isAuthPage && !isOnboardingPage) {
            if (isEmployee && verifiedToken) {
                const role = verifiedToken.role || 'employee'
                const department = (verifiedToken.department?.toLowerCase() || 'employee') as DepartmentType

                const homePage = role === 'admin' || role === 'manager'
                    ? departmentHomePage.admin
                    : departmentHomePage[department] || '/'

                return NextResponse.redirect(new URL(homePage, request.url))
            } else {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }

        // Prevent direct access to onboarding without signup
        if (isOnboardingPage && !request.cookies.get('hasCompletedSignup')) {
            return NextResponse.redirect(new URL('/auth/signup', request.url))
        }

        // Handle role-based access control for employees
        if (isAuthenticated && isEmployee && verifiedToken) {
            const pathSegment = pathname.split('/')[1] || 'dashboard'
            const role = verifiedToken.role || 'employee'
            const department = (verifiedToken.department?.toLowerCase() || 'employee') as DepartmentType

            let allowedSections: string[] = []

            if (role === 'admin') {
                allowedSections = departmentAccess.admin
            } else if (role === 'manager') {
                allowedSections = [...departmentAccess.manager]
                const deptAccess = departmentAccess[department] || []
                
                for (const item of deptAccess) {
                    if (!allowedSections.includes(item)) {
                        allowedSections.push(item)
                    }
                }
            } else {
                allowedSections = departmentAccess[department] || departmentAccess.employee
            }

            if (!allowedSections.includes(pathSegment) && pathSegment !== '') {
                const homePage = departmentHomePage[department] || '/settings'
                return NextResponse.redirect(new URL(homePage, request.url))
            }

            if (pathSegment === '' && pathname === '/') {
                if (role !== 'admin' && role !== 'manager') {
                    const homePage = departmentHomePage[department] || '/settings'
                    return NextResponse.redirect(new URL(homePage, request.url))
                }
            }
        }

        return NextResponse.next()
    } catch (error) {
        // Silent fail in production, log in development
        if (process.env.NODE_ENV !== 'production') {
            console.error('Middleware error:', error);
        }
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
    ],
}
