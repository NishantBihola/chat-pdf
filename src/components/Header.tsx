"use client";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur dark:bg-zinc-950/70">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-2xl font-semibold tracking-tight">
          Chat to <span className="text-indigo-600">PDF</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/dashboard/upgrade" className="hidden rounded-md px-3 py-1.5 text-indigo-600 underline-offset-4 hover:underline md:inline-block">
            Pricing
          </Link>
          <SignedIn>
            <Link className="rounded-md border px-3 py-1.5" href="/dashboard">Dashboard</Link>
            <Link className="rounded-md bg-black px-3 py-1.5 text-white" href="/dashboard/upload">Upload</Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-md bg-black px-3 py-1.5 text-white">Sign in</button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
