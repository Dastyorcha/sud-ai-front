import type { ProceduralDocumentTemplate } from "@/shared/constants/document-templates";
import type { MessageKey } from "@/shared/lib/i18n/messages";
import type { CourtCase } from "@/shared/types/models";
import type { DocumentSections } from "@/features/document-fill/document-sections";

/** Matches `useTranslation().t` — kept generic so callers pass it straight through. */
type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Empty section text — the editor's starting point before AI fill. */
export function emptyDocumentSections(): DocumentSections {
  return { intro: "", descriptive: "", reasoning: "", conclusion: "" };
}

/**
 * Mock "AI to'ldirish": builds placeholder section text for `template`,
 * interpolating real case facts (case number, parties, subject, claim
 * amount). This is a UI stub, not a legal-drafting engine — every generated
 * paragraph is marked for domain (legal) review before use.
 */
export function fillDocumentSections(
  template: ProceduralDocumentTemplate,
  courtCase: CourtCase,
  t: Translate
): DocumentSections {
  const parties =
    courtCase.claimantName && courtCase.defendantName
      ? `${courtCase.claimantName} ${t("cases.vs")} ${courtCase.defendantName}`
      : courtCase.subject;
  const templateTitle = t(template.titleKey);
  const article = t("documentsWorkspace.templateSelector.article", {
    code: template.articleCode,
  });

  return {
    intro: [
      `${courtCase.courtName}`,
      `${t("documentsWorkspace.factsPanel.caseNumber")}: ${courtCase.caseNumber}`,
      `${parties}`,
    ].join("\n"),
    descriptive: `${courtCase.subject}${
      courtCase.claimAmount != null
        ? ` (${t("documentsWorkspace.factsPanel.claimAmount")}: ${courtCase.claimAmount.toLocaleString()})`
        : ""
    }`,
    reasoning: `[${templateTitle}, ${article}] — ${t("documentsWorkspace.editor.aiFillDone")}.`,
    conclusion: `${templateTitle}.`,
  };
}

const SECTION_ORDER: Array<keyof DocumentSections> = [
  "intro",
  "descriptive",
  "reasoning",
  "conclusion",
];

function downloadBlob(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export stub (spec: no real DOCX/PDF backend yet) — downloads a `.txt` or
 * `.html` blob of the current section text. `sectionLabels` keys sections by
 * their translated title for readability in the exported file.
 */
export function exportDocumentSections(
  title: string,
  sections: DocumentSections,
  sectionLabels: Record<keyof DocumentSections, string>,
  format: "txt" | "html"
): void {
  if (format === "txt") {
    const body = SECTION_ORDER.map(
      (id) => `${sectionLabels[id]}\n${"-".repeat(sectionLabels[id].length)}\n${sections[id]}`
    ).join("\n\n");
    downloadBlob(`${title}.txt`, `${title}\n\n${body}`, "text/plain;charset=utf-8");
    return;
  }

  const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = SECTION_ORDER.map(
    (id) =>
      `<h2>${escapeHtml(sectionLabels[id])}</h2><p>${escapeHtml(sections[id]).replace(/\n/g, "<br/>")}</p>`
  ).join("\n");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    title
  )}</title></head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
  downloadBlob(`${title}.html`, html, "text/html;charset=utf-8");
}
