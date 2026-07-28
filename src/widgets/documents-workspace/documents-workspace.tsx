import { useMemo, useState } from "react";
import { Download, FileText, Printer, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { LoadingState } from "@/shared/custom/loading-state";
import { ErrorState } from "@/shared/custom/error-state";
import { TemplateSelector } from "@/widgets/template-selector/template-selector";
import { CaseFactsPanel } from "@/widgets/case-facts-panel/case-facts-panel";
import { DocumentEditor } from "@/widgets/document-editor/document-editor";
import {
  DOCUMENT_SECTION_ORDER,
  type DocumentSections,
} from "@/features/document-fill/document-sections";
import {
  emptyDocumentSections,
  exportDocumentSections,
  fillDocumentSections,
} from "@/features/document-fill/document-fill";
import { DOCUMENT_EDITOR_PRINT_AREA_ID } from "@/widgets/document-editor/document-editor";
import type { ProceduralDocumentTemplate } from "@/shared/constants/document-templates";
import { useCase } from "@/features/cases/use-case";
import { useTranslation } from "@/shared/lib/i18n/locale-context";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import { notify } from "@/shared/lib/toast";

export interface DocumentsWorkspaceProps {
  caseId: string;
}

/**
 * "Sud hujjatlari" tab (mockup-06): template selector, "Ish ma'lumotlari"
 * facts panel and the sectioned document editor, with mock "AI to'ldirish"
 * (`document-fill`) and export/print stubs. Lazy-loaded from `case-detail`.
 */
export default function DocumentsWorkspace({ caseId }: DocumentsWorkspaceProps) {
  const { t } = useTranslation();
  const { data: courtCase, isLoading, error } = useCase(caseId);
  const [selectedTemplate, setSelectedTemplate] = useState<ProceduralDocumentTemplate | null>(null);
  const [sections, setSections] = useState<DocumentSections>(emptyDocumentSections());

  const sectionLabels = useMemo(
    () =>
      DOCUMENT_SECTION_ORDER.reduce(
        (acc, id) => {
          acc[id] = t(`documentsWorkspace.editor.sections.${id}` as MessageKey);
          return acc;
        },
        {} as Record<(typeof DOCUMENT_SECTION_ORDER)[number], string>
      ),
    [t]
  );

  if (isLoading) return <LoadingState rows={5} />;
  if (error || !courtCase) return <ErrorState />;

  function handleSelectTemplate(template: ProceduralDocumentTemplate) {
    setSelectedTemplate(template);
    setSections(emptyDocumentSections());
  }

  function handleSectionChange(id: (typeof DOCUMENT_SECTION_ORDER)[number], value: string) {
    setSections((prev) => ({ ...prev, [id]: value }));
  }

  function handleAiFill() {
    if (!selectedTemplate || !courtCase) return;
    setSections(fillDocumentSections(selectedTemplate, courtCase, t));
    notify.success(t("documentsWorkspace.editor.aiFillDone"));
  }

  function handleExport(format: "txt" | "html") {
    const title = selectedTemplate
      ? t(selectedTemplate.titleKey)
      : t("documentsWorkspace.editor.untitled");
    exportDocumentSections(title, sections, sectionLabels, format);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,320px)_1fr]">
        <TemplateSelector
          selectedId={selectedTemplate?.id ?? null}
          onSelect={handleSelectTemplate}
        />
        <CaseFactsPanel courtCase={courtCase} />

        <div className="flex flex-col gap-3">
          {selectedTemplate ? (
            <>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button size="sm" variant="gold" onClick={handleAiFill}>
                  <Sparkles className="size-4" />
                  {t("documentsWorkspace.editor.aiFill")}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Download className="size-4" />
                      {t("documentsWorkspace.editor.export")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleExport("txt")}>
                      {t("documentsWorkspace.editor.exportTxt")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("html")}>
                      {t("documentsWorkspace.editor.exportHtml")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="size-4" />
                  {t("documentsWorkspace.editor.print")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground print:hidden">
                {t("documentsWorkspace.editor.domainReviewNote")}
              </p>
              <DocumentEditor
                titleKey={selectedTemplate.titleKey}
                sections={sections}
                onSectionChange={handleSectionChange}
              />
            </>
          ) : (
            <div
              id={DOCUMENT_EDITOR_PRINT_AREA_ID}
              className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-center"
            >
              <FileText className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {t("documentsWorkspace.editor.selectPrompt")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
