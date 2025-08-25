// Server component – no "use client" here
import { auth } from "@clerk/nextjs/server";
import ChatToPdf from "@/components/ChatToPdf";

type PageProps = { params: { id: string } };

export default async function DocumentPage({ params }: PageProps) {
  const { userId } = auth();
  // Optionally redirect if not signed in:
  // if (!userId) redirect("/sign-in");

  // You can fetch server-side data here if needed
  const docId = params.id;

  return <ChatToPdf docId={docId} ownerId={userId ?? ""} />;
}
