import * as z from "zod"

export const onboardingSchema = z.object({
    // Basic Company Info
    companyName: z.string().min(2, "Company name is required"),
    industry: z.string().min(2, "Industry is required"),
    companySize: z.string().optional(),
    description: z.string().optional(),

    // Contact & Location
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),

    // Business Operations
    businessType: z.string().optional(),
    operatingHours: z.string().optional(),
    mainProducts: z.string().optional(),

    // Industry Specific
    technologyStack: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    manufacturingCapacity: z.string().optional(),
    retailLocations: z.number().optional(),

    // Department Setup
    departments: z.array(z.string()),
    additionalInfo: z.string().optional(),

    // User email to link the company to the user
    userEmail: z.string().email("Invalid email address"),
}) 