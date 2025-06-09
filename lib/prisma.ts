import { PrismaClient } from '@prisma/client'

declare global {
    var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        errorFormat: 'minimal',
        // Optimize for serverless
        transactionOptions: {
            maxWait: 5000, // 5 seconds
            timeout: 10000, // 10 seconds
        },
    })
}

// Use this approach to prevent multiple instances during hot reloading in development
export const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
}

// Define a function to check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined';

// Serverless-optimized connection handling
if (!isBrowser()) {
    // For serverless environments, we don't pre-connect
    // Connections are established on-demand and managed by Prisma

    // Only add event handlers in Node.js runtime (not Edge)
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        // Development-only connection monitoring
        try {
            prisma.$connect().then(() => {
                console.log('Prisma client connected in development')
            }).catch((error) => {
                console.error('Prisma connection error in development:', error)
            })
        } catch (error) {
            console.error('Error setting up Prisma connection:', error)
        }
    }
}