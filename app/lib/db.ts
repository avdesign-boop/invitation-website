import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1017"]);
const RETRY_DELAYS_MS = [500, 1500, 3000];
const CONNECT_TIMEOUT_SECONDS = "15";

function connectionUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return undefined;
  }
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", CONNECT_TIMEOUT_SECONDS);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function isConnectionFailure(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return error instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE_CODES.has(error.code);
}

function createClient(): PrismaClient {
  const created = new PrismaClient({ datasourceUrl: connectionUrl() });
  created.$use(async (params, next) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await next(params);
      } catch (error) {
        const delay = RETRY_DELAYS_MS[attempt];
        if (params.runInTransaction || delay === undefined || !isConnectionFailure(error)) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  });
  return created;
}

const client = globalForPrisma.prisma ?? createClient();

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
