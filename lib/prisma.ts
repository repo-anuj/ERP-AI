import { PrismaClient } from '@prisma/client'

declare global {
    var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: ['error', 'warn'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        errorFormat: 'minimal',
    })
}

// Use this approach to prevent multiple instances during hot reloading in development
export const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
}

// Define a function to check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined';

// Only connect in server contexts, not in browser
if (!isBrowser()) {
    // Test the connection with retry logic (only in server context)
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

    // Only attempt connection in server environment
    // Wrap in try/catch to prevent unhandled promise rejections
    try {
        connectWithRetry().catch((error) => {
            console.error('All database connection attempts failed:', error)
            // Don't exit process in browser context
            if (typeof process !== 'undefined' && process.exit) {
                process.exit(1)
            }
        })
    } catch (error) {
        console.error('Error during database connection setup:', error)
    }
}