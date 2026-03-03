import { PrismaClient } from "@prisma/client";

const globalState = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalState.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalState.prisma = prisma;
}
