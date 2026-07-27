import { X, FileText } from "lucide-react";
import { FileDropzone } from "@/shared/components/ui/file-dropzone";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  REQUIRED_DOCUMENT_KEYS,
  type RequiredDocumentKey,
} from "@/features/case-create/categories";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";

export interface DocumentsStepProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  checkedDocs: RequiredDocumentKey[];
  onCheckedDocsChange: (docs: RequiredDocumentKey[]) => void;
}

/** Step 4: in-memory document upload + required-docs checklist (mockup-03, no backend upload yet). */
export function DocumentsStep({
  files,
  onFilesChange,
  checkedDocs,
  onCheckedDocsChange,
}: DocumentsStepProps) {
  const { t } = useTranslation();

  function addFiles(picked: File[]) {
    onFilesChange([...files, ...picked]);
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  function toggleDoc(key: RequiredDocumentKey, checked: boolean) {
    onCheckedDocsChange(checked ? [...checkedDocs, key] : checkedDocs.filter((k) => k !== key));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("caseWizard.documentsTitle")}</h3>
        <FileDropzone
          onFiles={addFiles}
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
          label={t("caseWizard.uploadLabel")}
          hint={t("caseWizard.uploadHint")}
        />

        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("caseWizard.noFiles")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2 truncate text-foreground">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("caseWizard.removeFile")}
                  onClick={() => removeFile(index)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("caseWizard.requiredDocsTitle")}
        </h3>
        <ul className="flex flex-col gap-2">
          {REQUIRED_DOCUMENT_KEYS.map((key) => (
            <li key={key}>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={checkedDocs.includes(key)}
                  onCheckedChange={(checked) => toggleDoc(key, Boolean(checked))}
                />
                {t(`caseWizard.requiredDocs.${key}` as MessageKey)}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
