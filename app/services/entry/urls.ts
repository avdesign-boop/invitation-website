export function inviteUrl(slug: string, token: string): string {
  const rootDomain = process.env.ROOT_DOMAIN;
  if (rootDomain) {
    const protocol = rootDomain.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${slug}.${rootDomain}/i/${token}`;
  }
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return `${appUrl}/w/${slug}/i/${token}`;
}
