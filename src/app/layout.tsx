import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
// If you use a Toaster from shadcn/react-hot-toast, import it here
// import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Chat PDF",
  description: "PDF bot using full stack",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* <Toaster />  ← only one, here */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
