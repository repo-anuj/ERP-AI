import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

export async function GET() {
    try {
        // Test database connection
        await prisma.$connect()
        console.log("Database connection successful")

        // Count users as a simple test
        const userCount = await prisma.user.count()
        console.log("Current user count:", userCount)

        return NextResponse.json({
            status: "success",
            message: "Database connection successful",
            userCount
        })
    } catch (error) {
        console.error("Database connection error:", error)
        return NextResponse.json({
            status: "error",
            message: "Database connection failed",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
} 