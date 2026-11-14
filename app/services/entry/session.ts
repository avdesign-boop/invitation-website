import type { NextRequest, NextResponse } from "next/server";
import { call } from "@/lib/call";
import { AppError } from "@/lib/errors";

export const SESSION_COOKIE = "session";

export async function requireBusinessId(request: NextRequest): Promise<string> {
  const sessionId = readSessionId(request);
  if (!sessionId) {
    throw new AppError(401, "not logged in");
  }
  const result = await call("business.validateSession", { sessionId });
  if (!result) {
    throw new AppError(401, "not logged in");
  }
  return result.businessId;
}

export type SessionGrant = { id: string; expiresAt: Date };

export function readSessionId(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

export function setSessionCookie(response: NextResponse, session: SessionGrant): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: session.id,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
}
