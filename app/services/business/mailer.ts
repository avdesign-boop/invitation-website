import type { MagicLinkPurpose } from "@prisma/client";

const RESEND_URL = "https://api.resend.com/emails";

export type MagicLinkEmail = {
  email: string;
  url: string;
  purpose: MagicLinkPurpose;
  expiresInMinutes: number;
};

export type LoginCodeEmail = {
  email: string;
  code: string;
  expiresInMinutes: number;
};

type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
  logLine: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function deliver(message: Message): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.log(message.logLine);
    return;
  }
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Email send failed with status ${response.status}`);
  }
}

export async function sendMagicLink(input: MagicLinkEmail): Promise<void> {
  const isSignup = input.purpose === "SIGNUP";
  const subject = isSignup ? "Set your password to finish signing up" : "Reset your password";
  const intro = isSignup
    ? "Welcome. Use the link below to set your password and finish creating your account."
    : "Use the link below to choose a new password.";
  const outro = `This link works once and expires in ${input.expiresInMinutes} minutes. If you did not ask for it, you can ignore this email.`;
  await deliver({
    to: input.email,
    subject,
    text: `${intro}\n\n${input.url}\n\n${outro}`,
    html: [
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${escapeHtml(input.url)}">${escapeHtml(subject)}</a></p>`,
      `<p>${escapeHtml(outro)}</p>`,
    ].join(""),
    logLine: `Magic link for ${input.email}: ${input.url}`,
  });
}

export async function sendLoginCode(input: LoginCodeEmail): Promise<void> {
  const subject = `Your login code is ${input.code}`;
  const intro = "Someone is signing in to your account from a browser we do not know. Enter this code to continue.";
  const outro = `The code works once and expires in ${input.expiresInMinutes} minutes. If this was not you, do not share the code, and change your password.`;
  await deliver({
    to: input.email,
    subject,
    text: `${intro}\n\n${input.code}\n\n${outro}`,
    html: [
      `<p>${escapeHtml(intro)}</p>`,
      `<p style="font-size:24px;letter-spacing:4px"><strong>${escapeHtml(input.code)}</strong></p>`,
      `<p>${escapeHtml(outro)}</p>`,
    ].join(""),
    logLine: `Login code for ${input.email}: ${input.code}`,
  });
}
