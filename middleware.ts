import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Hanya untuk /api/chat
  if (request.nextUrl.pathname === "/api/chat") {
    // DEBUG: Log cookie dan header yang diterima
    const cookieToken = request.cookies.get("token")?.value;
    const authHeader = request.headers.get("authorization");
    const authHeaderToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    console.log("[Middleware] /api/chat request");
    console.log("[Middleware] Cookie token:", cookieToken ? `${cookieToken.substring(0, 50)}...` : "NONE");
    console.log("[Middleware] Auth header token:", authHeaderToken ? `${authHeaderToken.substring(0, 50)}...` : "NONE");

    // FIXED: Use Authorization header token, NOT cookies!
    let token = authHeaderToken;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Middleware] Using token:", token.substring(0, 50) + "...");

    // Lanjutkan request dengan token in Authorization header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("Authorization", `Bearer ${token}`);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
