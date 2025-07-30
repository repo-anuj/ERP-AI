import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { onboardingSchema } from "@/lib/validations/onboarding"
import { getCountryConfig } from "@/lib/country-config"
import { generateSampleData } from "@/lib/industry-templates"
export const dynamic = 'force-dynamic';

export const runtime = 'nodejs'

export async function POST(req: Request) {
    try {
        console.log("Enhanced onboarding API called")
        const body = await req.json()
        console.log("Request body:", JSON.stringify(body, null, 2))

        // Validate request body
        const result = onboardingSchema.safeParse(body)
        if (!result.success) {
            console.log("Validation failed:", result.error.errors)
            return NextResponse.json({
                error: "Invalid input",
                details: result.error.errors
            }, { status: 400 })
        }

        const { userEmail, ...onboardingData } = body

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

        // Get country configuration for defaults
        const countryConfig = getCountryConfig(onboardingData.country)
        console.log("Country config:", countryConfig)

        try {
            // Start database transaction for data consistency
            const result_data = await prisma.$transaction(async (tx) => {
                // Create company with comprehensive data
                const company = await tx.company.create({
                    data: {
                        // Basic Information
                        name: onboardingData.companyName,
                        legalName: onboardingData.legalName,
                        address: onboardingData.address,
                        city: onboardingData.city,
                        state: onboardingData.state,
                        zipCode: onboardingData.zipCode,
                        country: onboardingData.country,
                        phone: onboardingData.phone,
                        email: userEmail,
                        website: onboardingData.website,

                        // Business Configuration
                        businessType: onboardingData.primaryIndustry,
                        businessModel: onboardingData.businessModel,
                        companyStage: onboardingData.companyStage,
                        primaryGoal: onboardingData.primaryGoal,
                        industry: onboardingData.primaryIndustry,

                        // Branding & Identity
                        logo: onboardingData.logo,
                        companyStamp: onboardingData.companyStamp,
                        brandColors: onboardingData.brandColors,
                        tagline: onboardingData.tagline,
                        socialMedia: onboardingData.socialMedia,

                        // Financial & Legal
                        defaultCurrency: countryConfig?.currency || 'USD',
                        taxId: onboardingData.taxId,
                        businessRegistrationNumber: onboardingData.businessRegistrationNumber,
                        vatNumber: onboardingData.vatNumber,
                        panNumber: onboardingData.panNumber,
                        einNumber: onboardingData.einNumber,
                        gstNumber: onboardingData.gstNumber,
                        businessLicense: onboardingData.businessLicense,
                        fiscalYearStart: countryConfig?.fiscalYear.split('-')[0] || 'January',
                        accountingMethod: onboardingData.accountingMethod || 'accrual',

                        // Operations
                        timezone: onboardingData.timezone,
                        language: onboardingData.language || 'en',
                        operatingHours: onboardingData.operatingHours,
                        workingDays: onboardingData.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                        holidays: onboardingData.holidays,

                        // Industry-specific details
                        manufacturingDetails: onboardingData.manufacturingDetails,
                        serviceDetails: onboardingData.serviceDetails,
                        retailDetails: onboardingData.retailDetails,

                        // Financial Configuration
                        bankAccounts: onboardingData.bankAccounts,
                        paymentMethods: onboardingData.paymentMethods,
                        payrollFrequency: onboardingData.payrollFrequency,
                        payrollProvider: onboardingData.payrollProvider,

                        // Integrations
                        paymentGateways: onboardingData.paymentGateways,

                        // Onboarding tracking
                        onboardingStep: 10, // Mark as completed
                        onboardingCompleted: true,
                        onboardingData: onboardingData, // Store complete onboarding data

                        users: {
                            connect: { id: user.id }
                        }
                    }
                })

                console.log("Company created:", company.id)

                // Create departments if provided
                if (onboardingData.departments && onboardingData.departments.length > 0) {
                    console.log("Creating departments:", onboardingData.departments.length)
                    for (const dept of onboardingData.departments) {
                        await tx.department.create({
                            data: {
                                name: dept.name,
                                description: dept.description,
                                budget: dept.budget,
                                location: dept.location,
                                companyId: company.id
                            }
                        })
                    }
                }

                // Create locations if provided
                if (onboardingData.locations && onboardingData.locations.length > 0) {
                    console.log("Creating locations:", onboardingData.locations.length)
                    for (const location of onboardingData.locations) {
                        await tx.location.create({
                            data: {
                                name: location.name,
                                address: location.address,
                                type: location.type,
                                capacity: location.capacity,
                                companyId: company.id
                            }
                        })
                    }
                }

                // Create vehicles if provided (for manufacturing/logistics)
                if (onboardingData.vehicles && onboardingData.vehicles.length > 0) {
                    console.log("Creating vehicles:", onboardingData.vehicles.length)
                    for (const vehicle of onboardingData.vehicles) {
                        await tx.vehicle.create({
                            data: {
                                vehicleNumber: vehicle.vehicleNumber,
                                type: vehicle.type,
                                capacity: vehicle.capacity,
                                driver: vehicle.driver,
                                insuranceProvider: vehicle.insurance?.provider,
                                policyNumber: vehicle.insurance?.policyNumber,
                                insuranceExpiry: vehicle.insurance?.expiryDate ? new Date(vehicle.insurance.expiryDate) : undefined,
                                companyId: company.id
                            }
                        })
                    }
                }

                return company
            })

            // Update user onboarding status
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    onboardingCompleted: true
                }
            })

            // Generate sample data if requested
            if (onboardingData.generateSampleData) {
                console.log("Generating sample data...")
                await generateAndInsertSampleData(result_data.id, onboardingData.primaryIndustry, onboardingData.sampleDataTypes)
            }

            console.log("Enhanced company created successfully:", {
                id: result_data.id,
                name: result_data.name,
                businessType: result_data.businessType,
                country: result_data.country
            })

            return NextResponse.json({
                message: "Company profile created successfully",
                company: {
                    id: result_data.id,
                    name: result_data.name,
                    businessType: result_data.businessType,
                    country: result_data.country,
                    currency: result_data.defaultCurrency
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
        console.error("Enhanced onboarding error:", error)
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}

async function generateAndInsertSampleData(companyId: string, industry: string, sampleDataTypes: any) {
    try {
        console.log("Generating sample data for industry:", industry)
        const sampleData = generateSampleData(industry, companyId)
        if (!sampleData) {
            console.log("No sample data template found for industry:", industry)
            return
        }

        // Create sample departments
        if (sampleDataTypes?.employees && sampleData.departments) {
            console.log("Creating sample departments:", sampleData.departments.length)
            for (const dept of sampleData.departments) {
                await prisma.department.upsert({
                    where: {
                        name_companyId: {
                            name: dept.name,
                            companyId: dept.companyId
                        }
                    },
                    update: {},
                    create: dept
                })
            }
        }

        // Create sample inventory categories
        if (sampleDataTypes?.products && sampleData.inventoryCategories) {
            console.log("Creating sample inventory categories:", sampleData.inventoryCategories.length)
            for (const category of sampleData.inventoryCategories) {
                await prisma.budgetCategory.create({
                    data: category
                })
            }
        }

        // Create sample products
        if (sampleDataTypes?.products && sampleData.sampleProducts) {
            console.log("Creating sample products:", sampleData.sampleProducts.length)
            for (const product of sampleData.sampleProducts) {
                await prisma.inventoryItem.create({
                    data: product
                })
            }
        }

        // Create sample customers if requested
        if (sampleDataTypes?.customers) {
            console.log("Creating sample customers")
            const sampleCustomers = [
                {
                    name: 'ABC Corporation',
                    email: 'contact@abccorp.com',
                    phone: '+1-555-0123',
                    address: '123 Business St, City, State 12345',
                    companyId
                },
                {
                    name: 'XYZ Industries',
                    email: 'info@xyzind.com',
                    phone: '+1-555-0456',
                    address: '456 Industrial Ave, City, State 67890',
                    companyId
                },
                {
                    name: 'Global Solutions Ltd',
                    email: 'hello@globalsolutions.com',
                    phone: '+1-555-0789',
                    address: '789 Corporate Blvd, City, State 54321',
                    companyId
                }
            ]

            for (const customer of sampleCustomers) {
                await prisma.customer.create({
                    data: customer
                })
            }
        }

        // Create sample transactions if requested
        if (sampleDataTypes?.transactions) {
            console.log("Creating sample transactions")
            const sampleTransactions = [
                {
                    date: new Date(),
                    description: 'Sample Sale Transaction',
                    amount: 1500.00,
                    type: 'income',
                    companyId
                },
                {
                    date: new Date(Date.now() - 86400000), // Yesterday
                    description: 'Office Supplies Purchase',
                    amount: -250.00,
                    type: 'expense',
                    companyId
                },
                {
                    date: new Date(Date.now() - 172800000), // 2 days ago
                    description: 'Client Payment Received',
                    amount: 2000.00,
                    type: 'income',
                    companyId
                }
            ]

            for (const transaction of sampleTransactions) {
                await prisma.transaction.create({
                    data: transaction
                })
            }
        }

        console.log('Sample data generated successfully for company:', companyId)
    } catch (error) {
        console.error('Error generating sample data:', error)
        // Don't throw error - sample data generation is optional
    }
}