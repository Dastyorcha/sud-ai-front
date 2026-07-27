import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { onAppendToSection } from "@/features/document-fill/document-append-bus";
import {
  DOCUMENT_SECTION_ORDER,
  type DocumentSectionId,
  type DocumentSections,
} from "@/features/document-fill/document-sections";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { cn } from "@/shared/lib/utils";

export type { DocumentSectionId, DocumentSections };

export interface DocumentEditorProps {
  /** Selected template's title key, or `undefined` for the untitled placeholder. */
  titleKey?: MessageKey;
  sections: DocumentSections;
  onSectionChange: (id: DocumentSectionId, value: string) => void;
  className?: string;
}

/** DOM id the "Chop etish" print CSS scopes printing to (`src/shared/styles/print.css`). */
export const DOCUMENT_EDITOR_PRINT_AREA_ID = "document-editor-print-area";

/**
 * Sectioned document editor (mockup-06): collapsible Card per section I–IV,
 * an "AI yordamida" badge on section III (asoslantiruvchi), controlled
 * `Textarea` per section. Subscribes to `document-fill`'s append bus so
 * external features (mockup-07 judge copilot) can insert text into a
 * section while this editor is mounted.
 */
export function DocumentEditor({
  titleKey,
  sections,
  onSectionChange,
  className,
}: DocumentEditorProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<Set<DocumentSectionId>>(new Set());
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const onSectionChangeRef = useRef(onSectionChange);
  onSectionChangeRef.current = onSectionChange;

  useEffect(
    () =>
      onAppendToSection((sectionId, text) => {
        const id = sectionId as DocumentSectionId;
        if (!DOCUMENT_SECTION_ORDER.includes(id)) return;
        const current = sectionsRef.current[id] ?? "";
        onSectionChangeRef.current(id, current ? `${current}\n\n${text}` : text);
        setCollapsed((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }),
    []
  );

  function toggleCollapsed(id: DocumentSectionId) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="text-base">
          {titleKey ? t(titleKey) : t("documentsWorkspace.editor.untitled")}
        </CardTitle>
      </CardHeader>
      <CardContent id={DOCUMENT_EDITOR_PRINT_AREA_ID} className="flex flex-col gap-3">
        {DOCUMENT_SECTION_ORDER.map((id) => {
          const isCollapsed = collapsed.has(id);
          return (
            <div key={id} className="rounded-lg border border-border">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="flex-1 text-sm font-medium text-foreground">
                  {t(`documentsWorkspace.editor.sections.${id}` as MessageKey)}
                </span>
                {id === "reasoning" && (
                  <Badge className="border-transparent bg-gold-soft text-gold-foreground">
                    <Sparkles className="mr-1 size-3" aria-hidden="true" />
                    {t("documentsWorkspace.editor.aiAssisted")}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 print:hidden"
                  aria-label={t(
                    isCollapsed
                      ? "documentsWorkspace.editor.expand"
                      : "documentsWorkspace.editor.collapse"
                  )}
                  onClick={() => toggleCollapsed(id)}
                >
                  {isCollapsed ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronUp className="size-4" />
                  )}
                </Button>
              </div>
              {!isCollapsed && (
                <div className="border-t border-border p-3">
                  <Textarea
                    value={sections[id]}
                    onChange={(e) => onSectionChange(id, e.target.value)}
                    placeholder={t("documentsWorkspace.editor.placeholder")}
                    rows={6}
                    aria-label={t(`documentsWorkspace.editor.sections.${id}` as MessageKey)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default DocumentEditor;
