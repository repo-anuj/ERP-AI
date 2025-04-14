import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && (
      error.code === 'P2010' || // Raw query error
      error.message?.includes('Connection pool') ||
      error.message?.includes('InternalError') ||
      error.message?.includes('RetryableWriteError')
    )) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Attempt to reconnect Prisma
      try {
        await (prisma as any).$disconnect();
        await (prisma as any).$connect();
      } catch (reconnectError) {
        console.error('Failed to reconnect to database:', reconnectError);
      }
      
      // Retry the operation
      console.log(`Retrying operation. Attempts remaining: ${retries - 1}`);
      return withRetry(operation, retries - 1, delay);
    }
    
    throw error;
  }
}
