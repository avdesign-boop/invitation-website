import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const client = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = client;
}

const activeTransaction = new AsyncLocalStorage<Prisma.TransactionClient>();

export const db = new Proxy(client, {
  get(target, property) {
    const source = (activeTransaction.getStore() ?? target) as unknown as Record<string | symbol, unknown>;
    const value = source[property];
    return typeof value === "function" ? value.bind(source) : value;
  },
}) as PrismaClient;

export function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  return client.$transaction((tx) => activeTransaction.run(tx, fn));
}

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
