import "@/services";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { call, getOperationMeta, type OperationMeta, type Operations } from "@/lib/call";
import { AppError } from "@/lib/errors";
import {
  clearSessionCookie,
  readClientIp,
  readDeviceId,
  readSessionId,
  requireBusinessId,
  setDeviceCookie,
  setSessionCookie,
  type DeviceGrant,
  type SessionGrant,
} from "@/services/entry/session";

type RouteContext = { params: Promise<Record<string, string>> };

export function handle<C = unknown>(
  fn: (request: NextRequest, context: C) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: C): Promise<NextResponse> => {
    try {
      return await fn(request, context);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof ZodError) {
        return NextResponse.json({ error: "invalid input" }, { status: 400 });
      }
      console.error(error);
      return NextResponse.json({ error: "internal error" }, { status: 500 });
    }
  };
}

async function readInput(request: NextRequest, meta: OperationMeta): Promise<Record<string, unknown>> {
  if (!meta.schema) {
    return {};
  }
  let raw: unknown;
  if (request.method === "GET") {
    raw = Object.fromEntries(request.nextUrl.searchParams);
  } else {
    try {
      raw = await request.json();
    } catch {
      throw new AppError(400, "invalid input");
    }
  }
  return meta.schema.parse(raw) as Record<string, unknown>;
}

function respond(result: unknown, meta: OperationMeta): NextResponse {
  if (meta.notFound && result == null) {
    const missing = meta.notFound === true ? { status: 404, message: "not found" } : meta.notFound;
    throw new AppError(missing.status, missing.message);
  }
  let payload = result;
  let session: SessionGrant | undefined;
  let device: DeviceGrant | undefined;
  if (typeof result === "object" && result !== null && ("session" in result || "device" in result)) {
    const { session: grantedSession, device: grantedDevice, ...rest } = result as {
      session?: SessionGrant;
      device?: DeviceGrant;
    };
    session = grantedSession;
    device = grantedDevice;
    payload = rest;
  }
  const response = NextResponse.json(meta.message ? { message: meta.message } : payload, {
    status: meta.status ?? 200,
  });
  if (session) {
    setSessionCookie(response, session);
  }
  if (device) {
    setDeviceCookie(response, device);
  }
  if (meta.clearSession) {
    clearSessionCookie(response);
  }
  return response;
}

function route(operation: keyof Operations, authenticated: boolean) {
  return handle<RouteContext>(async (request, context) => {
    const meta = getOperationMeta(operation);
    const input: Record<string, unknown> = {};
    if (authenticated) {
      input.businessId = await requireBusinessId(request);
    }
    if (meta.idParam) {
      input[meta.idParam] = (await context.params).id;
    }
    if (meta.sessionInput) {
      input.sessionId = readSessionId(request) ?? "";
    }
    if (meta.deviceInput) {
      input.deviceId = readDeviceId(request);
      input.ip = readClientIp(request);
      input.userAgent = request.headers.get("user-agent") ?? undefined;
    }
    Object.assign(input, await readInput(request, meta));
    const result = await call(operation, input as never);
    return respond(result, meta);
  });
}

export function authedRoute(operation: keyof Operations) {
  return route(operation, true);
}

export function publicRoute(operation: keyof Operations) {
  return route(operation, false);
}
