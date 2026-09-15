/** Display labels only: keep stable AI slot identifiers unchanged in saved content. */
const LABELS: Record<string, string> = {
  introduction: "Kirish qismi",
  opening: "Sud majlisining ochilishi",
  attendance: "Ishtirokchilarning kelishi",
  absence: "Kelmagan ishtirokchilar",
  recusal: "Rad etish haqidagi arizalar",
  rights: "Huquq va majburiyatlarni tushuntirish",
  motions: "Iltimosnomalar",
  report: "Ish bo‘yicha ma’ruza",
  statements: "Ishtirokchilarning tushuntirishlari",
  additional_motions: "Qo‘shimcha iltimosnomalar",
  deliberation: "Maslahatxonaga chiqish",
  announced_result: "E’lon qilingan natija",
  appeal_explanation: "Shikoyat qilish tartibini tushuntirish",
  closure: "Sud majlisining yakunlanishi",
  biography: "Shaxsga oid ma’lumotlar",
  preamble: "Dastlabki ma’lumotlar",
  facts: "Aniqlangan holatlar",
  reasoning: "Asoslantiruvchi qism",
  legal_basis: "Huquqiy asoslar",
  body: "Asosiy qism",
};

export function documentSectionLabel(key: string): string {
  return LABELS[key.toLowerCase()] ?? key;
}
