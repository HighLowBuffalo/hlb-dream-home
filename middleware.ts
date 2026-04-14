import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TODO: Wire up Supabase auth check
  // const session = await getSession(request);

  // Protect client routes
  if (
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/survey") ||
    pathname.startsWith("/report")
  ) {
    // TODO: if no session, redirect to /login
    // if (!session) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    // TODO: if no session or not admin, redirect
    // if (!session) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }
    // if (!session.user.is_admin) {
    //   return NextResponse.redirect(new URL("/welcome", request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/welcome/:path*",
    "/survey/:path*",
    "/report/:path*",
    "/admin/:path*",
  ],
};
