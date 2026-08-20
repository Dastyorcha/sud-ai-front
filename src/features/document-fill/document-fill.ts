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
  const subject = courtCase.subject ?? courtCase.description ?? "";
  const parties =
    courtCase.claimantName && courtCase.defendantName
      ? `${courtCase.claimantName} ${t("cases.vs")} ${courtCase.defendantName}`
      : subject;
  const templateTitle = t(template.titleKey);
  const article = t("documentsWorkspace.templateSelector.article", {
    code: template.articleCode,
  });

  const commonIntro = [
    courtCase.courtName.toUpperCase(),
    `${t("documentsWorkspace.factsPanel.caseNumber")}: ${courtCase.caseNumber}`,
    parties || "[Taraflar ish materiallaridan olinadi]",
  ].join("\n");

  if (template.id === "economic-hearing-protocol-v1") {
    return {
      intro: `${commonIntro}\n\nSUD MAJLISI BAYONNOMASI\n[Majlis sanasi va joyi]`,
      descriptive: [
        "Sud majlisi raislik qiluvchi sudya va sud majlisi kotibi ishtirokida o‘tkazildi.",
        `Ko‘rilayotgan masala: ${subject || "[ish predmeti]"}.`,
        "Kelgan shaxslar, ularning vakolatlari va protsessual huquqlari ish kartasi asosida tekshirildi.",
      ].join("\n\n"),
      reasoning: [
        "Majlisning borishi vaqt belgilariga ega transkript va tasdiqlangan protsessual hodisalar asosida ketma-ket bayon etiladi.",
        "Har bir muhim summa, sana, shaxs va talab original audio yoki yuklangan ish hujjatidagi manbaga bog‘lanadi.",
      ].join("\n\n"),
      conclusion:
        "Majlis natijasi va keyingi protsessual harakat sudya tasdiqlagan ma’lumotlar asosida kiritiladi.\n\nRaislik qiluvchi: __________\nSud majlisi kotibi: __________",
    };
  }

  if (template.id === "civil-debt-court-order-v1") {
    return {
      intro: `${commonIntro}\n\nSUD BUYRUG‘I\nQarzdorlikni undirish to‘g‘risida`,
      descriptive: `Undiruvchining ${subject || "qarzdorlikni undirish"} haqidagi arizasi va unga ilova qilingan hujjatlar ko‘rib chiqildi.`,
      reasoning: [
        `Talab summasi: ${courtCase.claimAmount != null ? courtCase.claimAmount.toLocaleString("uz-UZ") + " so‘m" : "[manbadan olinadi]"}.`,
        "Majburiyatning kelib chiqish asosi, to‘lov muddati va qarzdor haqidagi rekvizitlar faqat ish materiallaridagi tasdiqlangan manbalardan olinadi.",
      ].join("\n\n"),
      conclusion:
        "UNDIRILSIN:\n1. Asosiy qarz — [tasdiqlangan summa].\n2. Davlat boji va pochta xarajatlari — [tasdiqlangan summa].\n\nSudya: __________",
    };
  }

  if (template.id === "economic-cassation-leave-without-review-v1") {
    return {
      intro: `${commonIntro}\n\nAJRIM\nKassatsiya shikoyatini ko‘rmasdan qoldirish to‘g‘risida`,
      descriptive:
        "Kassatsiya shikoyati, taraflarning vajlari va ish materiallaridagi protsessual hujjatlar o‘rganildi.",
      reasoning:
        "Shikoyatni ko‘rmasdan qoldirishga asos bo‘lgan protsessual holat va tegishli qonun normasi sudya tomonidan tanlanadi; LexKotib AI faqat tasdiqlangan natijani hujjat formatiga joylaydi.",
      conclusion:
        "AJRIM QILDI:\nKassatsiya shikoyati [sudya tasdiqlagan asos]ga ko‘ra ko‘rmasdan qoldirilsin.\n\nSudya: __________",
    };
  }

  if (template.id === "criminal-judgment-v1") {
    return {
      intro: `${commonIntro}\n\nO‘ZBEKISTON RESPUBLIKASI NOMIDAN\nHUKM`,
      descriptive:
        "Sudlanuvchi, ayblov mazmuni, taraflar pozitsiyasi va tekshirilgan dalillar ish materiallari hamda sud majlisi transkriptidan manbali tarzda bayon qilinadi.",
      reasoning:
        "Dalillarga yakuniy huquqiy baho, ayb masalasi va jazo turi faqat sudya tomonidan belgilanadi. AI ushbu bo‘limda mustaqil qaror chiqarmaydi.",
      conclusion:
        "HUKM QILDI:\n[Sudya tasdiqlagan rezolyutiv qism kiritiladi.]\n\nRaislik qiluvchi sudya: __________",
    };
  }

  return {
    intro: [
      `${courtCase.courtName}`,
      `${t("documentsWorkspace.factsPanel.caseNumber")}: ${courtCase.caseNumber}`,
      `${parties}`,
    ].join("\n"),
    descriptive: `${subject}${
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
