import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Check if the path is for admin routes
  const isAdminRoute = path.startsWith("/admin")

  // Get the user role from the session or token
  // This is a simplified example - you should use a proper auth solution
  const userRole = request.cookies.get("user_role")?.value || "patient"

  // If trying to access admin route but not an admin, redirect to unauthorized page
  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all routes that start with admin
    "/admin/:path*",
    // Add other protected routes as needed
  ],
}
