import { NextResponse, type NextRequest } from "next/server";

const reserved = new Set(["www", "app", "admin"]);

export function middleware(request: NextRequest) {
  const rootDomain = process.env.ROOT_DOMAIN;
  if (!rootDomain) {
    return NextResponse.next();
  }
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const root = rootDomain.split(":")[0];
  if (!host.endsWith(`.${root}`)) {
    return NextResponse.next();
  }
  const slug = host.slice(0, -(root.length + 1));
  if (!slug || slug.includes(".") || reserved.has(slug)) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = `/w/${slug}${request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/i/:path*"],
};
