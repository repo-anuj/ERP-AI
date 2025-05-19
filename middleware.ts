import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth'

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

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    const isOnboardingPage = request.nextUrl.pathname === '/auth/onboarding'
    const isEmployee = request.cookies.get('isEmployee')?.value === 'true'

    // Verify authentication
    const verifiedToken = token && await verifyAuth(token).catch(() => null)
    const isAuthenticated = !!verifiedToken

    // Redirect to sign in if accessing protected routes while not authenticated
    if (!isAuthenticated && !isAuthPage) {
        const redirectUrl = new URL('/auth/signin', request.url)
        redirectUrl.searchParams.set('from', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Redirect to appropriate home page if accessing auth pages while authenticated
    if (isAuthenticated && isAuthPage && !isOnboardingPage) {
        if (isEmployee && verifiedToken) {
            // Get employee role and department
            const role = verifiedToken.role || 'employee'
            const department = (verifiedToken.department?.toLowerCase() || 'employee') as DepartmentType

            // Determine home page based on role and department
            const homePage = role === 'admin' || role === 'manager'
                ? departmentHomePage.admin
                : departmentHomePage[department] || '/'

            return NextResponse.redirect(new URL(homePage, request.url))
        } else {
            // Regular users go to dashboard
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // Prevent direct access to onboarding without signup
    if (isOnboardingPage && !request.cookies.get('hasCompletedSignup')) {
        return NextResponse.redirect(new URL('/auth/signup', request.url))
    }

    // Handle role-based access control for employees
    if (isAuthenticated && isEmployee && verifiedToken) {
        // Get the first path segment (e.g., /hr/something -> hr)
        const pathSegment = request.nextUrl.pathname.split('/')[1] || 'dashboard'

        // Get employee role and department
        const role = verifiedToken.role || 'employee'
        const department = (verifiedToken.department?.toLowerCase() || 'employee') as DepartmentType

        // Determine allowed sections based on role and department
        let allowedSections = []

        if (role === 'admin') {
            // Admin can access everything
            allowedSections = departmentAccess.admin
        } else if (role === 'manager') {
            // Managers get manager access plus their department access
            // Combine arrays and remove duplicates without using Set spread
            const combinedAccess = [...departmentAccess.manager];
            const deptAccess = departmentAccess[department] || [];

            // Add items from department access if they don't already exist
            for (const item of deptAccess) {
                if (!combinedAccess.includes(item)) {
                    combinedAccess.push(item);
                }
            }

            allowedSections = combinedAccess;
        } else {
            // Regular employees get their department access
            allowedSections = departmentAccess[department] || departmentAccess.employee
        }

        // Check if the current path is allowed
        if (!allowedSections.includes(pathSegment) && pathSegment !== '') {
            // Redirect to department home page if trying to access unauthorized section
            const homePage = departmentHomePage[department] || '/settings'
            return NextResponse.redirect(new URL(homePage, request.url))
        }

        // If accessing root path, redirect to department home page
        if (pathSegment === '' && request.nextUrl.pathname === '/') {
            // Don't redirect admins and managers from dashboard
            if (role !== 'admin' && role !== 'manager') {
                const homePage = departmentHomePage[department] || '/settings'
                return NextResponse.redirect(new URL(homePage, request.url))
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}