import { AppError } from "@/lib/errors";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

const RESERVED_SLUGS = new Set(["www", "app", "admin", "api", "w"]);

export function assertValidSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.has(slug)) {
    throw new AppError(400, "invalid slug");
  }
}
