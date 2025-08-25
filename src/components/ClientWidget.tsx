"use client";

export default function ClientWidget({ nonce }: { nonce?: string }) {
  // NOTE: No headers() here. You only consume the prop.
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm">
        Client component. Nonce passed from server:{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5">{nonce ?? "none"}</code>
      </p>
    </div>
  );
}
