import FileUploader from "@/components/FileUploader";

export default function UploadPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upload your PDF</h1>
      <FileUploader />
    </div>
  );
}
