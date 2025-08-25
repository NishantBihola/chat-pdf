import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PageProps = { params: { id: string } };

export default async function FilePage({ params }: PageProps) {
  const supabase = supabaseAdmin();

  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !doc) {
    // You can throw notFound() or render an error UI
    return <div className="p-6">Document not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{doc.title}</h1>
      <div className="text-sm text-gray-500 mt-1">
        Status: {doc.status} • Uploaded: {new Date(doc.created_at).toLocaleString()}
      </div>
      {/* render viewer/chat/etc here */}
    </div>
  );
}
