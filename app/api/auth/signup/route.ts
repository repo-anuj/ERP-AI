import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as z from "zod"
import { hashPassword } from "@/lib/password"

export const runtime = 'nodejs'

const signUpSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
})

export async function POST(req: Request) {
    try {
        console.log("Signup API called")
        const body = await req.json()
        console.log("Request body:", { ...body, password: '[REDACTED]' })

        // Validate request body
        const result = signUpSchema.safeParse(body)
        if (!result.success) {
            console.log("Validation failed:", result.error.errors)
            return NextResponse.json({
                error: "Invalid input",
                details: result.error.errors
            }, { status: 400 })
        }

        const { email, password, firstName, lastName } = body

        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            })

            if (existingUser) {
                console.log("User already exists:", email)
                return NextResponse.json({
                    error: "Email already registered"
                }, { status: 400 })
            }

            // Hash password
            const hashedPassword = await hashPassword(password)
            console.log("Password hashed successfully")

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                },
            })
            console.log("User created successfully:", { id: user.id, email: user.email })

            // Return success response (excluding password)
            const { password: _, ...userData } = user
            return NextResponse.json({
                user: userData,
                message: "Account created successfully"
            }, {
                status: 201,
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        } catch (dbError) {
            console.error("Database operation failed:", dbError)
            return NextResponse.json({
                error: "Database operation failed",
                details: dbError instanceof Error ? dbError.message : "Unknown database error"
            }, { status: 500 })
        }
    } catch (error) {
        console.error("Sign-up error:", error)
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
} 