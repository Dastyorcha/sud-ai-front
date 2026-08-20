import {
  CalendarClock,
  ClipboardList,
  FileCheck2,
  FileClock,
  FileMinus2,
  FilePlus2,
  FileQuestion,
  FileX,
  FileX2,
  Gavel,
  HelpCircle,
  Microscope,
  PauseCircle,
  Scale,
  SearchCheck,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/shared/lib/i18n/messages";

/**
 * The five grouped rows of the "Sud hujjatlari" template selector (mockup-06).
 * Distinct from the spec's `DocumentTemplate` model (§13.2, driving the real
 * AI-generation `inputSchema` flow) — this is a static, mockup-only catalogue
 * of Uzbek civil-procedure document names for the selector UI.
 */
export const DOCUMENT_TEMPLATE_GROUPS = [
  "claimReview",
  "preparation",
  "hearingDecisions",
  "suspensionTermination",
  "appeal",
] as const;

export type DocumentTemplateGroup = (typeof DOCUMENT_TEMPLATE_GROUPS)[number];

/** Placeholder legal text — every generated document needs domain (legal) review before use. */
export interface ProceduralDocumentTemplate {
  id: string;
  group: DocumentTemplateGroup;
  /** i18n key for the template's display title. */
  titleKey: MessageKey;
  /** FPK (Fuqarolik protsessual kodeksi) article number backing this document — placeholder, verify with legal counsel. */
  articleCode: string;
  /** Human-reviewed reference family supplied to the AI template library. */
  referenceFormat?: boolean;
  icon: LucideIcon;
}

/**
 * 17 procedural document templates across the 5 mockup groups. Titles and
 * article references are placeholders for the UI mockup and MUST be verified
 * against the current FPK/IPK text before any real use.
 */
export const PROCEDURAL_DOCUMENT_TEMPLATES: ProceduralDocumentTemplate[] = [
  {
    id: "economic-hearing-protocol-v1",
    group: "hearingDecisions",
    titleKey: "documentsWorkspace.templateSelector.templates.economicHearingProtocol",
    articleCode: "economic_hearing_protocol_v1",
    referenceFormat: true,
    icon: ClipboardList,
  },
  {
    id: "economic-cassation-leave-without-review-v1",
    group: "appeal",
    titleKey: "documentsWorkspace.templateSelector.templates.economicCassationLeaveWithoutReview",
    articleCode: "economic_cassation_leave_without_review_v1",
    referenceFormat: true,
    icon: FileX,
  },
  {
    id: "civil-debt-court-order-v1",
    group: "claimReview",
    titleKey: "documentsWorkspace.templateSelector.templates.civilDebtCourtOrder",
    articleCode: "civil_debt_court_order_v1",
    referenceFormat: true,
    icon: Scale,
  },
  {
    id: "criminal-judgment-v1",
    group: "hearingDecisions",
    titleKey: "documentsWorkspace.templateSelector.templates.criminalJudgment",
    articleCode: "criminal_judgment_v1",
    referenceFormat: true,
    icon: Gavel,
  },
  {
    id: "claim-accept",
    group: "claimReview",
    titleKey: "documentsWorkspace.templateSelector.templates.claimAccept",
    articleCode: "150",
    icon: FileCheck2,
  },
  {
    id: "claim-return",
    group: "claimReview",
    titleKey: "documentsWorkspace.templateSelector.templates.claimReturn",
    articleCode: "151",
    icon: FileX2,
  },
  {
    id: "claim-leave-without-movement",
    group: "claimReview",
    titleKey: "documentsWorkspace.templateSelector.templates.claimLeaveWithoutMovement",
    articleCode: "149",
    icon: FileClock,
  },
  {
    id: "claim-refuse-accept",
    group: "claimReview",
    titleKey: "documentsWorkspace.templateSelector.templates.claimRefuseAccept",
    articleCode: "148",
    icon: FileMinus2,
  },
  {
    id: "prep-hearing",
    group: "preparation",
    titleKey: "documentsWorkspace.templateSelector.templates.prepHearing",
    articleCode: "162",
    icon: ClipboardList,
  },
  {
    id: "prep-secure-evidence",
    group: "preparation",
    titleKey: "documentsWorkspace.templateSelector.templates.prepSecureEvidence",
    articleCode: "74",
    icon: SearchCheck,
  },
  {
    id: "prep-secure-claim",
    group: "preparation",
    titleKey: "documentsWorkspace.templateSelector.templates.prepSecureClaim",
    articleCode: "106",
    icon: ShieldCheck,
  },
  {
    id: "prep-appoint-expertise",
    group: "preparation",
    titleKey: "documentsWorkspace.templateSelector.templates.prepAppointExpertise",
    articleCode: "80",
    icon: Microscope,
  },
  {
    id: "hearing-adjourn",
    group: "hearingDecisions",
    titleKey: "documentsWorkspace.templateSelector.templates.hearingAdjourn",
    articleCode: "194",
    icon: CalendarClock,
  },
  {
    id: "hearing-decision",
    group: "hearingDecisions",
    titleKey: "documentsWorkspace.templateSelector.templates.hearingDecision",
    articleCode: "218",
    icon: Gavel,
  },
  {
    id: "hearing-additional-decision",
    group: "hearingDecisions",
    titleKey: "documentsWorkspace.templateSelector.templates.hearingAdditionalDecision",
    articleCode: "224",
    icon: FilePlus2,
  },
  {
    id: "hearing-explain-decision",
    group: "hearingDecisions",
    titleKey: "documentsWorkspace.templateSelector.templates.hearingExplainDecision",
    articleCode: "225",
    icon: HelpCircle,
  },
  {
    id: "suspend-proceedings",
    group: "suspensionTermination",
    titleKey: "documentsWorkspace.templateSelector.templates.suspendProceedings",
    articleCode: "232",
    icon: PauseCircle,
  },
  {
    id: "terminate-proceedings",
    group: "suspensionTermination",
    titleKey: "documentsWorkspace.templateSelector.templates.terminateProceedings",
    articleCode: "227",
    icon: XCircle,
  },
  {
    id: "leave-claim-unreviewed",
    group: "suspensionTermination",
    titleKey: "documentsWorkspace.templateSelector.templates.leaveClaimUnreviewed",
    articleCode: "229",
    icon: FileX,
  },
  {
    id: "appeal-accept",
    group: "appeal",
    titleKey: "documentsWorkspace.templateSelector.templates.appealAccept",
    articleCode: "287",
    icon: FileQuestion,
  },
  {
    id: "appeal-decision",
    group: "appeal",
    titleKey: "documentsWorkspace.templateSelector.templates.appealDecision",
    articleCode: "297",
    icon: Scale,
  },
];

/** `PROCEDURAL_DOCUMENT_TEMPLATES` grouped by `DocumentTemplateGroup`, in `DOCUMENT_TEMPLATE_GROUPS` order. */
export function groupedProceduralDocumentTemplates(): Array<{
  group: DocumentTemplateGroup;
  templates: ProceduralDocumentTemplate[];
}> {
  return DOCUMENT_TEMPLATE_GROUPS.map((group) => ({
    group,
    templates: PROCEDURAL_DOCUMENT_TEMPLATES.filter((tpl) => tpl.group === group),
  }));
}
