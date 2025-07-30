import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { verifyAuth } from './auth'

/**
 * Get the current authenticated entity (user or employee) with selected fields
 * NOTE: This function uses Prisma and should NOT be used in middleware
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
 * NOTE: This function uses Prisma and should NOT be used in middleware
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
