// middleware.ts
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher(["/dashboard(.*)"]);

function nonce16() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect(); // Clerk first

  const res = NextResponse.next();

  // CSP with per-request nonce
  const nonce = nonce16();
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http:`,
    `style-src 'self' 'unsafe-inline' https: http:`,
    `img-src 'self' blob: data: https:`,
    `connect-src 'self' https: wss:`,
    `font-src 'self' https: data:`,
    `media-src 'self' https: blob:`,
    `frame-src 'self' https:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'self'`,
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce); // <-- you’ll read this in server components
  return res;
});

export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
