import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // exact public paths - pages accessible without login
  const publicExactPaths = ["/login", "/signup", "/"];
  if (publicExactPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // public prefixes - APIs and public assets
  const publicPrefixes = ["/api/users", "/api/health"];
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Check for Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") // fast check for files (images, etc)
  ) {
    return NextResponse.next();
  }

  // Check for authentication token in cookies
  const token = request.cookies.get("token");

  // If no token exists, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    // loginUrl.searchParams.set("from", pathname); // Optional: redirect back after login
    return NextResponse.redirect(loginUrl);
  }

  // Allow request to proceed
  return NextResponse.next();
}

export const config = {
  // Apply to all routes except api (unless specific checks needed), _next, static
  // We explicitly filter in the function for more control
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
