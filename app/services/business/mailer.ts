export async function sendMagicLink(email: string, url: string): Promise<void> {
  console.log(`Magic link for ${email}: ${url}`);
}
