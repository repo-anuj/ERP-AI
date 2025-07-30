import * as z from "zod"

// Enhanced onboarding schema for comprehensive business setup
export const onboardingSchema = z.object({
    // Step 1: Business Discovery
    primaryIndustry: z.enum([
        'manufacturing', 'service', 'retail', 'consulting', 'technology',
        'healthcare', 'education', 'agriculture', 'logistics', 'finance', 'other'
    ]),
    businessModel: z.enum(['b2b', 'b2c', 'b2b2c', 'marketplace', 'saas']),
    companyStage: z.enum(['startup', 'growing', 'established', 'enterprise']),
    primaryGoal: z.enum([
        'inventory_management', 'sales_tracking', 'employee_management',
        'financial_control', 'project_management', 'all_in_one'
    ]),

    // Step 2: Company Identity & Branding
    companyName: z.string().min(2, "Company name is required"),
    legalName: z.string().optional(),
    tagline: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    logo: z.string().optional(), // Base64 or URL
    companyStamp: z.string().optional(), // Base64 or URL
    brandColors: z.object({
        primary: z.string().optional(),
        secondary: z.string().optional(),
        accent: z.string().optional()
    }).optional(),
    socialMedia: z.object({
        linkedin: z.string().optional(),
        twitter: z.string().optional(),
        facebook: z.string().optional(),
        instagram: z.string().optional()
    }).optional(),

    // Step 3: Location & Legal Setup
    country: z.string().min(2, "Country is required"),
    state: z.string().min(2, "State is required"),
    city: z.string().min(2, "City is required"),
    address: z.string().min(5, "Address is required"),
    zipCode: z.string().min(3, "ZIP/Postal code is required"),
    timezone: z.string().optional(),
    language: z.string().default("en"),

    // Legal Information (country-specific)
    businessRegistrationNumber: z.string().optional(),
    taxId: z.string().optional(), // GST, EIN, VAT, etc.
    vatNumber: z.string().optional(),
    panNumber: z.string().optional(), // India
    einNumber: z.string().optional(), // US
    gstNumber: z.string().optional(), // India
    businessLicense: z.string().optional(),

    // Step 4: Business Operations Setup
    operatingHours: z.object({
        monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
        tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
        wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
        thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
        friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
        saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional(),
        sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }).optional()
    }).optional(),
    workingDays: z.array(z.string()).optional(),
    holidays: z.array(z.object({
        date: z.string(),
        name: z.string()
    })).optional(),
    fiscalYearStart: z.string().optional(),

    // Industry-specific details
    manufacturingDetails: z.object({
        productionCapacity: z.string().optional(),
        machineryList: z.array(z.string()).optional(),
        qualityCertifications: z.array(z.string()).optional(),
        safetyCompliance: z.array(z.string()).optional()
    }).optional(),

    serviceDetails: z.object({
        serviceTypes: z.array(z.string()).optional(),
        serviceAreas: z.array(z.string()).optional(),
        appointmentDuration: z.number().optional()
    }).optional(),

    retailDetails: z.object({
        storeLocations: z.number().optional(),
        onlineStore: z.boolean().optional(),
        posSystem: z.string().optional()
    }).optional(),

    // Step 5: Financial Configuration
    accountingMethod: z.enum(['cash', 'accrual']).optional(),
    defaultCurrency: z.string().optional(),
    bankAccounts: z.array(z.object({
        bankName: z.string(),
        accountNumber: z.string(),
        routingNumber: z.string().optional(),
        ifscCode: z.string().optional(), // India
        swiftCode: z.string().optional(),
        accountType: z.enum(['checking', 'savings', 'business']),
        isPrimary: z.boolean().default(false)
    })).optional(),

    paymentMethods: z.object({
        cash: z.boolean().default(true),
        card: z.boolean().default(false),
        digitalWallet: z.boolean().default(false),
        bankTransfer: z.boolean().default(false),
        crypto: z.boolean().default(false)
    }).optional(),

    payrollFrequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
    payrollProvider: z.string().optional(),

    // Step 6: Organizational Structure
    departments: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        headOfDepartment: z.string().optional(),
        budget: z.number().optional(),
        location: z.string().optional()
    })).optional(),

    locations: z.array(z.object({
        name: z.string(),
        address: z.string(),
        type: z.enum(['headquarters', 'branch', 'warehouse', 'retail', 'manufacturing']),
        capacity: z.number().optional(),
        manager: z.string().optional()
    })).optional(),

    // Step 7: Employee Setup
    employees: z.array(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        role: z.string(),
        department: z.string().optional(),
        startDate: z.string(),
        salary: z.number().optional(),
        employeeId: z.string().optional(),
        inviteMethod: z.enum(['generate_password', 'send_invitation']).default('send_invitation'),
        bankAccount: z.object({
            accountNumber: z.string(),
            bankName: z.string(),
            ifscCode: z.string().optional()
        }).optional()
    })).optional(),

    // Step 8: Transportation & Logistics (for applicable businesses)
    vehicles: z.array(z.object({
        vehicleNumber: z.string(),
        type: z.enum(['truck', 'van', 'car', 'bike', 'forklift']),
        capacity: z.number().optional(),
        driver: z.string().optional(),
        insurance: z.object({
            provider: z.string(),
            policyNumber: z.string(),
            expiryDate: z.string()
        }).optional()
    })).optional(),

    // Step 9: Integration Setup
    paymentGateways: z.object({
        stripe: z.object({
            apiKey: z.string(),
            webhookSecret: z.string()
        }).optional(),
        razorpay: z.object({
            keyId: z.string(),
            keySecret: z.string()
        }).optional(),
        paypal: z.object({
            clientId: z.string(),
            clientSecret: z.string()
        }).optional()
    }).optional(),

    // Step 10: Sample Data & Tutorial
    generateSampleData: z.boolean().default(false),
    sampleDataTypes: z.object({
        customers: z.boolean().default(false),
        products: z.boolean().default(false),
        sales: z.boolean().default(false),
        employees: z.boolean().default(false),
        transactions: z.boolean().default(false)
    }).optional(),

    tutorialPreferences: z.object({
        showTutorials: z.boolean().default(true),
        tutorialStyle: z.enum(['tooltips', 'guided_tour', 'video']).default('guided_tour'),
        skipBasics: z.boolean().default(false)
    }).optional(),

    // Additional fields
    description: z.string().optional(),
    additionalInfo: z.string().optional(),

    // User email to link the company to the user
    userEmail: z.string().email("Invalid email address"),
})