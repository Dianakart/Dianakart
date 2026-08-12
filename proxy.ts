import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/auth";

export async function proxy(
  request: NextRequest
) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get(
    SESSION_COOKIE_NAME
  )?.value;

  const session = await verifyAdminToken(token);

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isLoginRoute =
    pathname === "/admin-login";

  if (isAdminRoute && !session) {
    const loginUrl = new URL(
      "/admin-login",
      request.url
    );

    loginUrl.searchParams.set(
      "from",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && session) {
    return NextResponse.redirect(
      new URL("/admin", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin-login",
  ],
};