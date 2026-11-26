import type { LoginResult, MagicLinkPurpose } from "@prisma/client";
import { deviceVerificationEnabled, signupEnabled } from "@/lib/config";
import { db, withTransaction } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { hashPassword, randomCode, randomToken, safeEqualHex, sha256, verifyPassword } from "./crypto";
import { describeBrowser } from "./device";
import { sendLoginCode, sendMagicLink } from "./mailer";
import type {
  BusinessSummary,
  LoginOutput,
  RequestContext,
  SessionGrant,
  VerifyDeviceOutput,
} from "./types";

const MAGIC_LINK_MINUTES = 30;
const SESSION_DAYS = 30;
const MIN_PASSWORD_LENGTH = 8;
const CODE_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const MAX_TRUSTED_DEVICES = 3;
const DEVICE_TRUST_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

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
    await tx.trustedDevice.deleteMany({ where: { businessId: link.businessId } });
  });
  return { ok: true };
}

async function recordEvent(
  businessId: string,
  result: LoginResult,
  context: RequestContext,
  deviceId?: string,
): Promise<void> {
  await db.loginEvent.create({
    data: {
      businessId,
      result,
      ip: context.ip ?? null,
      description: describeBrowser(context.userAgent),
      deviceId: deviceId ?? null,
    },
  });
}

async function createSession(businessId: string): Promise<SessionGrant> {
  const sessionId = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await db.session.create({
    data: { businessId, sessionHash: sha256(sessionId), expiresAt },
  });
  return { id: sessionId, expiresAt };
}

function findTrustedDevice(businessId: string, deviceId: string) {
  return db.trustedDevice.findFirst({ where: { businessId, deviceHash: sha256(deviceId) } });
}

async function sendCodeFor(business: { id: string; email: string }): Promise<string> {
  const code = randomCode();
  const challengeId = randomToken();
  await db.loginChallenge.create({
    data: {
      id: challengeId,
      businessId: business.id,
      codeHash: sha256(`${challengeId}:${code}`),
      expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000),
    },
  });
  await sendLoginCode({ email: business.email, code, expiresInMinutes: CODE_MINUTES });
  return challengeId;
}

export async function login(
  input: { email: string; password: string } & RequestContext,
): Promise<LoginOutput> {
  const business = await db.business.findUnique({ where: { email: normalizeEmail(input.email) } });
  const stored = business?.passwordHash ?? (await dummyPasswordHash);
  const valid = await verifyPassword(input.password, stored);
  if (!business || !business.passwordHash || !valid) {
    if (business) {
      await recordEvent(business.id, "WRONG_PASSWORD", input);
    }
    throw new AppError(401, "invalid credentials");
  }

  if (!deviceVerificationEnabled()) {
    const session = await createSession(business.id);
    await recordEvent(business.id, "SUCCESS", input);
    return { business: summary(business), session };
  }

  const device = input.deviceId ? await findTrustedDevice(business.id, input.deviceId) : null;
  if (device && device.verifiedAt.getTime() > Date.now() - DEVICE_TRUST_DAYS * DAY_MS) {
    await db.trustedDevice.update({ where: { id: device.id }, data: { lastUsedAt: new Date() } });
    const session = await createSession(business.id);
    await recordEvent(business.id, "SUCCESS", input, device.id);
    return { business: summary(business), session };
  }

  const challengeId = await sendCodeFor(business);
  await recordEvent(business.id, "CODE_SENT", input, device?.id);
  return { verificationRequired: true, challengeId };
}

export async function verifyDevice(
  input: { challengeId: string; code: string } & RequestContext,
): Promise<VerifyDeviceOutput> {
  const challenge = await db.loginChallenge.findUnique({
    where: { id: input.challengeId },
    include: { business: true },
  });
  if (!challenge || challenge.usedAt || challenge.expiresAt < new Date()) {
    throw new AppError(400, "invalid or expired code");
  }
  if (challenge.attempts >= MAX_CODE_ATTEMPTS) {
    throw new AppError(429, "too many attempts");
  }

  const business = challenge.business;
  if (!safeEqualHex(challenge.codeHash, sha256(`${challenge.id}:${input.code}`))) {
    const updated = await db.loginChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    await recordEvent(business.id, "WRONG_CODE", input);
    if (updated.attempts >= MAX_CODE_ATTEMPTS) {
      throw new AppError(429, "too many attempts");
    }
    throw new AppError(400, "invalid or expired code");
  }

  const result = await withTransaction(async () => {
    const claimed = await db.loginChallenge.updateMany({
      where: { id: challenge.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new AppError(400, "invalid or expired code");
    }

    const now = new Date();
    const description = describeBrowser(input.userAgent);
    const existing = input.deviceId ? await findTrustedDevice(business.id, input.deviceId) : null;
    let device: { id: string; deviceId: string };
    if (existing && input.deviceId) {
      await db.trustedDevice.update({
        where: { id: existing.id },
        data: { verifiedAt: now, lastUsedAt: now, description },
      });
      device = { id: existing.id, deviceId: input.deviceId };
    } else {
      const trusted = await db.trustedDevice.findMany({
        where: { businessId: business.id },
        orderBy: { lastUsedAt: "asc" },
        select: { id: true },
      });
      const excess = trusted.length - (MAX_TRUSTED_DEVICES - 1);
      if (excess > 0) {
        await db.trustedDevice.deleteMany({
          where: { id: { in: trusted.slice(0, excess).map((entry) => entry.id) } },
        });
      }
      const deviceId = randomToken();
      const created = await db.trustedDevice.create({
        data: {
          businessId: business.id,
          deviceHash: sha256(deviceId),
          description,
          verifiedAt: now,
          lastUsedAt: now,
        },
      });
      device = { id: created.id, deviceId };
    }
    const session = await createSession(business.id);
    return { session, device };
  });

  await recordEvent(business.id, "CODE_VERIFIED", input, result.device.id);
  return {
    business: summary(business),
    session: result.session,
    device: { id: result.device.deviceId },
  };
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
