import { PrismaClient } from '@prisma/client'

declare global {
    var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: ['query', 'error', 'warn'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        // Add retry configuration
        errorFormat: 'minimal',
    })
}

export const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
}

// Test the connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await prisma.$connect()
            console.log('Database connection established')
            return
        } catch (error) {
            console.error(`Database connection attempt ${i + 1} failed:`, error)
            if (i === retries - 1) throw error
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}

connectWithRetry().catch((error) => {
    console.error('All database connection attempts failed:', error)
    process.exit(1)
})