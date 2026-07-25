import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface FileDropzoneProps {
  /** Called with the picked files (click or drag-drop). */
  onFiles: (files: File[]) => void;
  /** `accept` attribute for the native picker (e.g. ".pdf,.docx,.jpg"). */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Main call-to-action label. */
  label: React.ReactNode;
  /** Secondary hint under the label (accepted types / size). */
  hint?: React.ReactNode;
  className?: string;
}

/**
 * Generic file picker with click + drag-and-drop. The only sanctioned home for
 * the raw `<input type="file">` — feature/view code composes this primitive
 * rather than hand-rolling file inputs (see CLAUDE.md "no raw HTML" rule).
 */
export function FileDropzone({
  onFiles,
  accept,
  multiple = true,
  disabled = false,
  label,
  hint,
  className,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  function emit(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(false);
        emit(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-background px-4 py-8 text-center transition-colors",
        "hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isDragging && "border-primary bg-accent/60",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <UploadCloud className="size-6 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          emit(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
