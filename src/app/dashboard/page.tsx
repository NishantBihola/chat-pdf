// app/dashboard/page.tsx
import { headers } from "next/headers";

export default async function DashboardPage() {
  // ✅ server component: await headers()
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <h2 className="mb-4 text-2xl font-semibold">My Documents</h2>

      {/* Example of inline script allowed by CSP because of the nonce */}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: `console.log("dashboard nonce ok")` }}
      />
    </main>
  );
}
