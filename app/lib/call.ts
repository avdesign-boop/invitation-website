import type { ZodType } from "zod";

export interface Operations {}

export type OperationMeta = {
  schema?: ZodType;
  idParam?: string;
  sessionInput?: boolean;
  clearSession?: boolean;
  status?: number;
  message?: string;
  notFound?: true | { status: number; message: string };
};

type InputOf<K extends keyof Operations> = Operations[K] extends { input: infer I } ? I : never;
type OutputOf<K extends keyof Operations> = Operations[K] extends { output: infer O } ? O : never;

type Handler = (input: unknown) => Promise<unknown>;

const handlers = new Map<string, Handler>();
const metas = new Map<string, OperationMeta>();

export function register<K extends keyof Operations>(
  name: K,
  handler: (input: InputOf<K>) => Promise<OutputOf<K>>,
  meta?: OperationMeta,
) {
  handlers.set(name, handler as Handler);
  if (meta) {
    metas.set(name, meta);
  }
}

export function getOperationMeta(name: keyof Operations): OperationMeta {
  return metas.get(name) ?? {};
}

export async function call<K extends keyof Operations>(
  name: K,
  input: InputOf<K>,
): Promise<OutputOf<K>> {
  const handler = handlers.get(name);
  if (!handler) {
    throw new Error(`Unknown operation: ${name}`);
  }
  return (await handler(input)) as OutputOf<K>;
}
