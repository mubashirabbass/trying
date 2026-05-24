/**
 * FileUploadButton — A reusable upload component for images and PDFs.
 * - Images: max 2 MB (JPEG, PNG, WebP)
 * - PDFs:   max 5 MB
 * On success it calls onUploaded(url) with the server-stored URL.
 */
import { useRef, useState } from "react";
import { Upload, X, FileText, ImageIcon, Loader2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

type AcceptType = "image" | "pdf";

interface Props {
  type: AcceptType;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
  /** If true, shows a download/view button when a file is already uploaded */
  showDownload?: boolean;
  /** Displayed filename when already uploaded */
  uploadedName?: string;
}

export function FileUploadButton({
  type,
  currentUrl,
  onUploaded,
  onClear,
  label,
  className = "",
  showDownload = true,
  uploadedName,
}: Props) {
  const { token } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = type === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "application/pdf";
  const endpoint = type === "image" ? "/api/upload/image" : "/api/upload/pdf";
  const maxLabel = type === "image" ? "Max 2 MB · JPEG, PNG, WebP" : "Max 5 MB · PDF only";

  const handleFile = async (file: File) => {
    setError(null);
    const maxBytes = type === "image" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(type === "image" ? "Image must be under 2 MB." : "PDF must be under 5 MB.");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(data.url);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const displayName = uploadedName || (currentUrl ? currentUrl.split("/").pop() : null);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <p className="text-xs font-black uppercase text-slate-500 tracking-wider">{label}</p>
      )}

      {/* Already-uploaded file row */}
      {currentUrl && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 dark:border-slate-700 shrink-0">
            {type === "image" ? (
              <img src={currentUrl} alt="preview" className="h-full w-full object-cover rounded-lg" />
            ) : (
              <FileText className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 truncate min-w-0">
            {displayName || "Uploaded file"}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {showDownload && (
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={type === "pdf"}
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors"
                title={type === "pdf" ? "Download PDF" : "View image"}
              >
                {type === "pdf" ? <Download className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
              </a>
            )}
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="h-7 w-7 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload trigger button */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 h-9 px-3 rounded-xl font-bold text-xs transition-all shadow-sm select-none">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" /> : type === "image" ? <ImageIcon className="h-3.5 w-3.5 text-indigo-500" /> : <Upload className="h-3.5 w-3.5 text-indigo-500" />}
          <span>{uploading ? "Uploading..." : currentUrl ? `Replace ${type === "image" ? "Image" : "PDF"}` : `Upload ${type === "image" ? "Image" : "PDF"}`}</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </label>
        <span className="text-[10px] text-slate-400 font-medium">{maxLabel}</span>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
          <X className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
