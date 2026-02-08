import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const isProtectedRoute = pathname.startsWith("/protected");

  // Placeholder: in Phase 9, set this based on refresh-token cookie
  const hasSession = request.cookies.has("refresh_token");

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasSession) {
    const appUrl = new URL("/protected/dashboard", request.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(protected)/:path*", "/login", "/register"],
};
