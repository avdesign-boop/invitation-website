import type { MagicLinkPurpose } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { signupEnabled } from "@/lib/config";
import { hashPassword, randomToken, sha256, verifyPassword } from "./crypto";
import { sendMagicLink } from "./mailer";
import type { BusinessSummary } from "./types";

const MAGIC_LINK_MINUTES = 30;
const SESSION_DAYS = 30;
const MIN_PASSWORD_LENGTH = 8;

const dummyPasswordHash = hashPassword("not-a-real-password");

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function assertSignupEnabled(): void {
  if (!signupEnabled()) {
    throw new AppError(403, "sign-up is turned off");
  }
}

function summary(business: { id: string; name: string; email: string }): BusinessSummary {
  return { id: business.id, name: business.name, email: business.email };
}

async function issueMagicLink(
  businessId: string,
  email: string,
  purpose: MagicLinkPurpose,
): Promise<void> {
  const token = randomToken();
  await db.magicLink.create({
    data: {
      businessId,
      tokenHash: sha256(token),
      purpose,
      expiresAt: new Date(Date.now() + MAGIC_LINK_MINUTES * 60 * 1000),
    },
  });
  await sendMagicLink({
    email,
    url: `${appUrl()}/set-password?token=${token}`,
    purpose,
    expiresInMinutes: MAGIC_LINK_MINUTES,
  });
}

export async function signup(input: { name: string; email: string }): Promise<{ ok: true }> {
  assertSignupEnabled();
  const email = normalizeEmail(input.email);
  const existing = await db.business.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return { ok: true };
  }
  const business = existing ?? (await db.business.create({ data: { name: input.name.trim(), email } }));
  await issueMagicLink(business.id, business.email, "SIGNUP");
  return { ok: true };
}

export async function forgotPassword(input: { email: string }): Promise<{ ok: true }> {
  const business = await db.business.findUnique({ where: { email: normalizeEmail(input.email) } });
  if (business?.passwordHash) {
    await issueMagicLink(business.id, business.email, "RESET");
  }
  return { ok: true };
}

export async function setPassword(input: { token: string; password: string }): Promise<{ ok: true }> {
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, "invalid input");
  }
  const link = await db.magicLink.findUnique({
    where: { tokenHash: sha256(input.token) },
    include: { business: true },
  });
  if (!link || link.usedAt || link.expiresAt < new Date()) {
    throw new AppError(400, "invalid or expired link");
  }
  const passwordHash = await hashPassword(input.password);

  await db.$transaction(async (tx) => {
    const claimed = await tx.magicLink.updateMany({
      where: { id: link.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new AppError(400, "invalid or expired link");
    }
    await tx.business.update({
      where: { id: link.businessId },
      data: { passwordHash, emailVerifiedAt: link.business.emailVerifiedAt ?? new Date() },
    });
    await tx.session.deleteMany({ where: { businessId: link.businessId } });
  });
  return { ok: true };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ business: BusinessSummary; session: { id: string; expiresAt: Date } }> {
  const business = await db.business.findUnique({ where: { email: normalizeEmail(input.email) } });
  const stored = business?.passwordHash ?? (await dummyPasswordHash);
  const valid = await verifyPassword(input.password, stored);
  if (!business || !business.passwordHash || !valid) {
    throw new AppError(401, "invalid credentials");
  }
  const sessionId = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { businessId: business.id, sessionHash: sha256(sessionId), expiresAt },
  });
  return { business: summary(business), session: { id: sessionId, expiresAt } };
}

export async function logout(input: { sessionId: string }): Promise<{ ok: true }> {
  await db.session.deleteMany({ where: { sessionHash: sha256(input.sessionId) } });
  return { ok: true };
}

export async function validateSession(input: { sessionId: string }): Promise<{ businessId: string } | null> {
  const session = await db.session.findUnique({ where: { sessionHash: sha256(input.sessionId) } });
  if (!session) {
    return null;
  }
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return { businessId: session.businessId };
}

export async function me(input: { businessId: string }): Promise<BusinessSummary | null> {
  const business = await db.business.findUnique({ where: { id: input.businessId } });
  return business ? summary(business) : null;
}
