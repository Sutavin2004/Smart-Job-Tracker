import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const isProtected = request.nextUrl.pathname.startsWith("/protected");

  if (isProtected) {
    const hasSession = request.cookies.has("refresh_token");

    if (!hasSession) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(protected)/:path*"],
};
