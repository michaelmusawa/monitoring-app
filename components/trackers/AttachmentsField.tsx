// Inside the same file (or import from a separate module)
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Paperclip, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Image from "next/image";

export function AttachmentsField({
  attachments,
  onChange,
}: {
  attachments: string[];
  onChange: (val: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Public S3 endpoint (must be set in .env.local)
  const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewFile(file);
    }
  };

  const uploadFile = async () => {
    if (!previewFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", previewFile);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange([...attachments, url]);
      setPreviewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("File uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const url = input.trim();
    if (!url) return;
    onChange([...attachments, url]);
    setInput("");
  };

  const remove = async (idx: number) => {
    const url = attachments[idx];
    console.log("Removing attachment:", url);
    console.log("S3 endpoint from env:", s3Endpoint);

    if (s3Endpoint && url.startsWith(s3Endpoint)) {
      console.log("This is an S3 file, attempting deletion...");
      try {
        const res = await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        console.log("Deletion successful");
      } catch (err) {
        console.error("Deletion error:", err);
        toast.error("Failed to delete file from server");
        return;
      }
    } else {
      console.log("External URL, skipping server deletion");
    }

    onChange(attachments.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [previewFile]);

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1">
        Attachments
      </label>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((url, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 border rounded-full px-2 py-0.5 text-xs"
            >
              <Paperclip className="w-3 h-3 text-zinc-400" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline max-w-[140px] truncate"
              >
                {url.split("/").pop() || url}
              </a>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-zinc-400 hover:text-red-500 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          placeholder="Paste URL and press Enter..."
          className="text-xs h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs shrink-0"
          onClick={addUrl}
        >
          Add URL
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="w-3 h-3 mr-1" />
          Upload File
        </Button>
        {previewFile && (
          <div className="flex items-center gap-2">
            {previewFile.type.startsWith("image/") && previewUrl ? (
              <Image
                src={previewUrl}
                alt="preview"
                className="h-8 w-8 object-cover rounded"
                width={50}
                height={50}
              />
            ) : (
              <FileText className="w-4 h-4 text-zinc-500" />
            )}
            <span className="text-xs text-zinc-600 truncate max-w-[100px]">
              {previewFile.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={uploadFile}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setPreviewFile(null)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
