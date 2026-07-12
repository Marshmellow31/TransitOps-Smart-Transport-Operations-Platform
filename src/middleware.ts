import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!);
const SESSION_COOKIE = "transitops_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let authed = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      authed = true;
    } catch {
      authed = false;
    }
  }

  if (pathname === "/login") {
    return authed ? NextResponse.redirect(new URL("/dashboard", req.url)) : NextResponse.next();
  }
  if (!authed) {
    const login = new URL("/login", req.url);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static assets requires auth
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
