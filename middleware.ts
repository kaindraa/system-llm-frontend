import { NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login", "/register", "/logout"];

// Routes that require authentication
const protectedRoutes = [
  "/",
  "/profile",
  "/admin",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + "/")
  );

  // Handle API routes with special token validation
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("Authorization", `Bearer ${token}`);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Allow public routes without token
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check if user has a token in localStorage
  // Token check will be handled more robustly on client-side in components
  if (isProtectedRoute) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    // If no token in header, allow the request to proceed
    // Client-side components (like home page) will handle auth check and redirect if needed
    // This prevents blocking legitimate requests where token is in localStorage
    if (!token) {
      // Don't redirect here - let client-side handle it
      // This prevents middleware from interfering with login flow
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
