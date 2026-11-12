import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  if (pathname === "/login") {
    if (isAdmin) return NextResponse.redirect(new URL("/", req.url));
    return;
  }

  if (!isAdmin) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
