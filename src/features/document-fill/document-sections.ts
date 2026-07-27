/**
 * The four fixed sections every procedural document is composed of
 * (mockup-06). Lives in `features/` (below `widgets/`) so both the
 * `DocumentEditor` widget and this feature's fill/export helpers can depend
 * on the same shape without inverting the FSD layering.
 */
export type DocumentSectionId = "intro" | "descriptive" | "reasoning" | "conclusion";

export const DOCUMENT_SECTION_ORDER: DocumentSectionId[] = [
  "intro",
  "descriptive",
  "reasoning",
  "conclusion",
];

export type DocumentSections = Record<DocumentSectionId, string>;
