import { NextResponse } from "next/server";
import { loginHint, signupEnabled } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ signupEnabled: signupEnabled(), loginHint: loginHint() });
}
