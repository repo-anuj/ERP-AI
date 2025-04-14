import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"
import { generateToken, setAuthCookie } from "@/lib/auth"
import { verifyPassword } from "@/lib/password"

// Configure route segment config
export const runtime = 'nodejs' // Changed from edge to nodejs for Prisma compatibility

// Define validation schema
const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: Request) {
    try {
        console.log("Sign-in API called")
        const body = await req.json()
        console.log("Request body:", { ...body, password: '[REDACTED]' })

        // Validate request body
        const result = signInSchema.safeParse(body)
        if (!result.success) {
            console.log("Validation failed:", result.error.errors)
            return NextResponse.json({
                error: "Invalid input",
                details: result.error.errors
            }, { status: 400 })
        }

        const { email, password } = body

        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            })

            if (!user) {
                console.log("User not found:", email)
                return NextResponse.json({
                    error: "No account found with this email"
                }, { status: 401 })
            }

            // Verify password
            const passwordMatch = await verifyPassword(password, user.password)
            if (!passwordMatch) {
                console.log("Invalid password for user:", email)
                return NextResponse.json({
                    error: "Invalid password"
                }, { status: 401 })
            }

            // Generate JWT token
            const { password: _, ...userData } = user
            const token = await generateToken(userData)

            // Set HTTP-only cookie
            const response = NextResponse.json({
                user: userData,
                message: "Successfully signed in"
            }, { status: 200 })

            // Set the auth cookie
            response.cookies.set('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            })

            // Set the hasCompletedSignup cookie if user has a company
            if (user.company) {
                response.cookies.set('hasCompletedSignup', 'true', {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                })
            }

            console.log("Sign-in successful for user:", email)
            return response

        } catch (dbError) {
            console.error("Database operation failed:", dbError)
            return NextResponse.json({
                error: "Database operation failed",
                details: dbError instanceof Error ? dbError.message : "Unknown database error"
            }, { status: 500 })
        }
    } catch (error) {
        console.error("Sign-in error:", error)
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}