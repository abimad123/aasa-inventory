import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin Route Protection
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url));
    }

    // Seller Route Protection
    if (path.startsWith("/seller") && token?.role !== "SELLER") {
      return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*"],
};
