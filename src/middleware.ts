import { NextRequest, NextResponse } from "next/server";

// Canonical host. Any other host that serves this app (www.tavadiena.lv, the
// default *.fly.dev hostname, etc.) is 301-redirected here so Google sees one
// canonical origin instead of duplicate content across hosts.
const CANONICAL_HOST = "tavadiena.lv";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();

  // Leave local development and the already-canonical host untouched.
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local");

  if (!isLocal && hostname !== CANONICAL_HOST) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
