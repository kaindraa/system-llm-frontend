import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Hanya untuk /api/chat
  if (request.nextUrl.pathname === "/api/chat") {
    // Try to get token dari cookies first, then from Authorization header
    let token = request.cookies.get("token")?.value;

    // If not in cookies, try to extract from Authorization header
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
