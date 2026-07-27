/**
 * Judge copilot fixtures (mockup-07) — per-case defects, law-article
 * suggestions, procedural deadlines and AI conclusions. All text is demo
 * content standing in for a future AI-analysis response; `case-1` is the
 * fully-populated fixture, the rest give lighter coverage so every case in
 * `COURT_CASES` renders at least one item per card.
 */
import type {
  CopilotDefect,
  CopilotDeadline,
  CopilotSuggestion,
  LawArticleRef,
} from "@/shared/types/copilot";

export const COPILOT_DEFECTS: CopilotDefect[] = [
  {
    id: "cd-1",
    caseId: "case-1",
    severity: "danger",
    title: "Da'vogar vakolatnomasi muddati o'tgan",
    description:
      "Ishga qo'shilgan vakolatnoma 2026-yil 1-iyunda tugagan — vakil ishtirokini tasdiqlovchi yangi hujjat talab qilinadi.",
  },
  {
    id: "cd-2",
    caseId: "case-1",
    severity: "warning",
    title: "Javobgarga xabarnoma yuborilgan sana aniq emas",
    description:
      "Bayonnomada javobgarning majlisga chaqiruv xabarnomasini olgan sanasi qayd etilmagan — FPK 121-moddasi talabini tekshiring.",
  },
  {
    id: "cd-3",
    caseId: "case-1",
    severity: "info",
    title: "Dalil sifatida taqdim etilgan nusxa tasdiqlanmagan",
    description:
      "Shartnoma nusxasi asl nusxa bilan solishtirilmagan — kotibga tasdiqlash uchun topshiriq berish tavsiya etiladi.",
  },
  {
    id: "cd-4",
    caseId: "case-2",
    severity: "warning",
    title: "Davlat boji to'liq to'lanmagan",
    description:
      "Da'vo summasidan kelib chiqqan holda hisoblangan davlat boji va taqdim etilgan kvitansiya summasi mos kelmaydi.",
  },
  {
    id: "cd-5",
    caseId: "case-3",
    severity: "info",
    title: "Ishga tayyorgarlik muddati yaqinlashmoqda",
    description: "Ish intake bosqichida — tayyorgarlik ajrimi hali chiqarilmagan.",
  },
  {
    id: "cd-6",
    caseId: "case-4",
    severity: "warning",
    title: "Bankrotlik boshqaruvchisi hisobotlari to'liq emas",
    description: "Ijro bosqichidagi oxirgi hisobot ishga ilova qilinmagan.",
  },
  {
    id: "cd-7",
    caseId: "case-5",
    severity: "danger",
    title: "Qaror e'lon qilish muddati tugashiga oz qoldi",
    description:
      "Qaror qismi bosqichida — motivlangan qarorni e'lon qilish muddati yaqinlashib qolmoqda.",
  },
];

export const COPILOT_LAW_ARTICLES: LawArticleRef[] = [
  {
    id: "cla-1",
    caseId: "case-1",
    source: "FPK",
    articleNumber: "168-modda",
    title: "Shartnoma majburiyatlarini bajarmaslik oqibatlari",
    relevance: 92,
    sourceNote: "Lex.uz, 2026-yil tahriri",
  },
  {
    id: "cla-2",
    caseId: "case-1",
    source: "FK",
    articleNumber: "327-modda",
    title: "Yetkazib berish shartnomasi bo'yicha javobgarlik",
    relevance: 86,
    sourceNote: "Lex.uz, 2026-yil tahriri",
  },
  {
    id: "cla-3",
    caseId: "case-1",
    source: "FPK",
    articleNumber: "121-modda",
    title: "Taraflarni sud majlisiga chaqirish tartibi",
    relevance: 74,
    sourceNote: "Lex.uz, 2026-yil tahriri",
  },
  {
    id: "cla-4",
    caseId: "case-2",
    source: "FK",
    articleNumber: "295-modda",
    title: "Qarzni undirish bo'yicha umumiy qoidalar",
    relevance: 88,
    sourceNote: "Lex.uz, 2026-yil tahriri",
  },
  {
    id: "cla-5",
    caseId: "case-3",
    source: "FPK",
    articleNumber: "149-modda",
    title: "Da'vo arizasini sud majlisiga tayyorlash",
    relevance: 69,
    sourceNote: "Lex.uz, 2026-yil tahriri",
  },
  {
    id: "cla-6",
    caseId: "case-4",
    source: "IPK",
    articleNumber: "54-modda",
    title: "Bankrotlik holatini tan olish tartibi",
    relevance: 81,
    sourceNote: "Lex.uz, 2026-yil tahriri",
  },
  {
    id: "cla-7",
    caseId: "case-5",
    source: "FK",
    articleNumber: "331-modda",
    title: "Muddatni buzganlik uchun neustoyka",
    relevance: 77,
    sourceNote: "Lex.uz, 2026-yil tahriri",
  },
];

export const COPILOT_DEADLINES: CopilotDeadline[] = [
  {
    id: "cdl-1",
    caseId: "case-1",
    urgency: "urgent",
    title: "Qarorni e'lon qilish muddati",
    description: "Ish ko'rib chiqilgach, motivlangan qarorni e'lon qilish uchun qonuniy muddat.",
    dueDate: "2026-07-30T18:00:00+05:00",
    totalDays: 10,
  },
  {
    id: "cdl-2",
    caseId: "case-1",
    urgency: "warning",
    title: "Ekspertiza xulosasini olish",
    description: "Tayinlangan sud ekspertizasi xulosasi taqdim etilishi kerak bo'lgan muddat.",
    dueDate: "2026-08-12T18:00:00+05:00",
    totalDays: 30,
  },
  {
    id: "cdl-3",
    caseId: "case-1",
    urgency: "normal",
    title: "Apellyatsiya shikoyati muddati",
    description: "Qaror qonuniy kuchga kirgach, apellyatsiya berish uchun umumiy muddat.",
    dueDate: "2026-09-15T18:00:00+05:00",
    totalDays: 45,
  },
  {
    id: "cdl-4",
    caseId: "case-2",
    urgency: "warning",
    title: "Javobgarning e'tirozini kutish muddati",
    description: "Javobgar da'vo arizasiga e'tiroz bildirishi mumkin bo'lgan muddat.",
    dueDate: "2026-08-05T18:00:00+05:00",
    totalDays: 15,
  },
  {
    id: "cdl-5",
    caseId: "case-3",
    urgency: "normal",
    title: "Ishni sud majlisiga tayyorlash muddati",
    description: "Intake bosqichidan tayyorgarlik bosqichiga o'tish uchun umumiy muddat.",
    dueDate: "2026-08-20T18:00:00+05:00",
    totalDays: 30,
  },
  {
    id: "cdl-6",
    caseId: "case-4",
    urgency: "normal",
    title: "Ijro hisobotini taqdim etish",
    description:
      "Bankrotlik boshqaruvchisi navbatdagi hisobotni taqdim etishi kerak bo'lgan muddat.",
    dueDate: "2026-09-01T18:00:00+05:00",
    totalDays: 60,
  },
  {
    id: "cdl-7",
    caseId: "case-5",
    urgency: "urgent",
    title: "Qarorni yozma shaklda rasmiylashtirish",
    description: "E'lon qilingan qarorni to'liq yozma shaklda rasmiylashtirish muddati.",
    dueDate: "2026-07-29T18:00:00+05:00",
    totalDays: 5,
  },
];

export const COPILOT_SUGGESTIONS: CopilotSuggestion[] = [
  {
    id: "cs-1",
    caseId: "case-1",
    tag: "Moddiy huquq",
    title: "Javobgarlik chorasini asoslash",
    text: "Taraflar o'rtasidagi 2026-yil 15-yanvardagi yetkazib berish shartnomasining 4.2-bandiga muvofiq, javobgar tomonidan tovarni belgilangan muddatda yetkazib bermaslik FK 327-moddasida nazarda tutilgan javobgarlikni keltirib chiqaradi.",
  },
  {
    id: "cs-2",
    caseId: "case-1",
    tag: "Protsessual",
    title: "Dalillarni baholash bo'yicha xulosa",
    text: "Sud tomonidan taqdim etilgan yozishmalar va to'lov hujjatlari FPK 168-moddasi talablariga muvofiq baholanib, da'vogarning talablari qisman asosli deb topildi.",
  },
  {
    id: "cs-3",
    caseId: "case-2",
    tag: "Moddiy huquq",
    title: "Qarz summasini hisoblash asosi",
    text: "Javobgarning shartnoma bo'yicha to'lov majburiyatini bajarmaganligi FK 295-moddasiga asosan qarz summasini undirish uchun yetarli asos hisoblanadi.",
  },
  {
    id: "cs-4",
    caseId: "case-3",
    tag: "Protsessual",
    title: "Tayyorgarlik chora-tadbirlari taklifi",
    text: "Ishni sud majlisiga tayyorlash bosqichida taraflardan qo'shimcha dalillar talab qilish FPK 149-moddasiga muvofiq tavsiya etiladi.",
  },
  {
    id: "cs-5",
    caseId: "case-4",
    tag: "Moddiy huquq",
    title: "Bankrotlik holatini tan olish xulosasi",
    text: "Taqdim etilgan moliyaviy hisobotlar IPK 54-moddasida belgilangan to'lovga qobiliyatsizlik mezonlariga mos kelishini ko'rsatadi.",
  },
  {
    id: "cs-6",
    caseId: "case-5",
    tag: "Moddiy huquq",
    title: "Neustoyka miqdorini asoslash",
    text: "Yetkazib berish muddatining buzilishi FK 331-moddasiga asosan neustoyka undirish uchun asos bo'lib, uning miqdori shartnoma shartlaridan kelib chiqib hisoblandi.",
  },
];
