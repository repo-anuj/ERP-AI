import { PrismaClient } from '@prisma/client'

declare global {
    var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient({
    log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
}

// Test the connection
prisma.$connect()
    .then(() => {
        console.log('Database connection established')
    })
    .catch((error) => {
        console.error('Database connection failed:', error)
    }) 