import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateEnvironment, getEnvironmentInfo } from "@/lib/env-validation"

export const runtime = 'nodejs'

export async function GET() {
    const startTime = Date.now()

    try {
        // Environment validation
        const envValidation = validateEnvironment()
        if (!envValidation.isValid) {
            return NextResponse.json({
                status: "error",
                message: "Environment validation failed",
                errors: envValidation.errors,
                warnings: envValidation.warnings
            }, { status: 500 })
        }

        // Test database connection
        await prisma.$connect()
        console.log("Database connection successful")

        // Perform basic database operations
        const [userCount, companyCount] = await Promise.all([
            prisma.user.count(),
            prisma.company.count()
        ])

        const responseTime = Date.now() - startTime

        return NextResponse.json({
            status: "success",
            message: "Health check passed",
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            database: {
                connected: true,
                userCount,
                companyCount
            },
            environment: getEnvironmentInfo(),
            validation: {
                errors: envValidation.errors,
                warnings: envValidation.warnings
            }
        })
    } catch (error) {
        const responseTime = Date.now() - startTime
        console.error("Health check failed:", error)

        return NextResponse.json({
            status: "error",
            message: "Health check failed",
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            error: error instanceof Error ? error.message : "Unknown error",
            environment: getEnvironmentInfo()
        }, { status: 500 })
    } finally {
        try {
            await prisma.$disconnect()
        } catch (disconnectError) {
            console.error("Error disconnecting from database:", disconnectError)
        }
    }
}