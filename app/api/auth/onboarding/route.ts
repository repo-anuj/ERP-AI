import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { onboardingSchema } from "@/lib/validations/onboarding"

export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        console.log("Onboarding API called")
        const body = await req.json()
        console.log("Request body:", body)

        // Validate request body
        const result = onboardingSchema.safeParse(body)
        if (!result.success) {
            console.log("Validation failed:", result.error.errors)
            return NextResponse.json({
                error: "Invalid input",
                details: result.error.errors
            }, { status: 400 })
        }

        const {
            companyName,
            industry,
            userEmail,
            ...otherData
        } = body

        // Find the user first
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        })

        if (!user) {
            console.log("User not found for email:", userEmail)
            return NextResponse.json({
                error: "User not found"
            }, { status: 404 })
        }

        console.log("Found user:", user.id)

        try {
            // Create the company
            const company = await prisma.company.create({
                data: {
                    name: companyName,
                    address: otherData.address,
                    phone: otherData.phone,
                    email: userEmail, // Use the user's email as the company email initially
                    users: {
                        connect: {
                            id: user.id
                        }
                    }
                }
            })

            console.log("Company created successfully:", { id: company.id, name: company.name })

            return NextResponse.json({
                message: "Company profile created successfully",
                company: {
                    id: company.id,
                    name: company.name
                }
            }, { status: 201 })

        } catch (dbError) {
            console.error("Database operation failed:", dbError)
            return NextResponse.json({
                error: "Failed to create company profile",
                details: dbError instanceof Error ? dbError.message : "Unknown database error"
            }, { status: 500 })
        }
    } catch (error) {
        console.error("Onboarding error:", error)
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}