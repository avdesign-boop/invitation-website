import type { MagicLinkPurpose } from "@prisma/client";

const RESEND_URL = "https://api.resend.com/emails";

export type MagicLinkEmail = {
  email: string;
  url: string;
  purpose: MagicLinkPurpose;
  expiresInMinutes: number;
};

type Message = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function compose(input: MagicLinkEmail): Message {
  const isSignup = input.purpose === "SIGNUP";
  const subject = isSignup ? "Set your password to finish signing up" : "Reset your password";
  const intro = isSignup
    ? "Welcome. Use the link below to set your password and finish creating your account."
    : "Use the link below to choose a new password.";
  const outro = `This link works once and expires in ${input.expiresInMinutes} minutes. If you did not ask for it, you can ignore this email.`;
  const text = `${intro}\n\n${input.url}\n\n${outro}`;
  const html = [
    `<p>${escapeHtml(intro)}</p>`,
    `<p><a href="${escapeHtml(input.url)}">${escapeHtml(subject)}</a></p>`,
    `<p>${escapeHtml(outro)}</p>`,
  ].join("");
  return { subject, html, text };
}

export async function sendMagicLink(input: MagicLinkEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.log(`Magic link for ${input.email}: ${input.url}`);
    return;
  }
  const message = compose(input);
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Email send failed with status ${response.status}`);
  }
}
