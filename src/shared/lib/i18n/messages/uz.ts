/**
 * uz (lotin) message tree — the source of truth for every string in the
 * panel and for the shape every other locale must match. Add a key here
 * first, then mirror it in `en.ts` and `ru.ts` (a missing key is a type
 * error in those files). See `docs/i18n.md`.
 */
export const uz = {
  common: {
    loading: "Yuklanmoqda…",
    retry: "Qayta urinish",
    close: "Yopish",
    save: "Saqlash",
    cancel: "Bekor qilish",
    back: "Orqaga",
    search: "Qidiruv",
    logout: "Chiqish",
    openMenu: "Menyuni ochish",
    toggleTheme: "Mavzuni almashtirish",
    profile: "Profil",
    comingSoonTitle: "Tez kunda",
    comingSoonDescription: "Bu bo‘lim hali ishlab chiqilmoqda.",
    allRightsReserved: "© {year} {app}. Barcha huquqlar himoyalangan.",
    noData: "Ma'lumot topilmadi",
  },
  nav: {
    dashboard: "Boshqaruv paneli",
    users: "Foydalanuvchilar",
  },
  pages: {
    dashboard: "Boshqaruv paneli",
    users: "Foydalanuvchilar",
    login: "Tizimga kirish",
    register: "Ro‘yxatdan o‘tish",
    resetPassword: "Parolni tiklash",
    selectOrganization: "Tashkilotni tanlash",
    tools: "Dizayn vositalari",
    forbidden: "Ruxsat yo‘q",
    notFound: "Sahifa topilmadi",
    maintenance: "Texnik ishlar",
  },
  enums: {
    roles: {
      admin: "Administrator",
      editor: "Muharrir",
      viewer: "Kuzatuvchi",
    },
  },
  errors: {
    notFoundTitle: "Sahifa topilmadi",
    notFoundDescription: "Siz izlagan sahifa mavjud emas yoki koʻchirilgan.",
    genericTitle: "Xatolik yuz berdi",
    genericDescription: "Sahifani qayta yuklab ko‘ring yoki keyinroq urinib ko‘ring.",
    forbiddenTitle: "Ruxsat yo‘q",
    forbiddenDescription: "Sizda bu sahifani ko‘rish uchun ruxsat yo‘q.",
    maintenanceTitle: "Texnik ishlar",
    maintenanceDescription: "Tizim vaqtincha ishlamayapti. Birozdan so‘ng qayta urinib ko‘ring.",
    codes: {
      validation_error: "Kiritilgan ma’lumotlar noto‘g‘ri. Tekshirib qayta urinib ko‘ring.",
      not_found: "So‘ralgan ma’lumot topilmadi.",
      forbidden: "Bu amal uchun ruxsat yo‘q.",
      conflict: "Ma’lumot boshqa o‘zgarish bilan to‘qnashdi. Sahifani yangilang.",
      network_error: "Tarmoq xatosi. Ulanishni tekshiring.",
      server_error: "Server xatosi. Birozdan so‘ng qayta urinib ko‘ring.",
      unknown: "Noma’lum xatolik yuz berdi.",
    },
  },
  langSwitcher: {
    label: "Til",
    changeLanguage: "Tilni almashtirish",
  },
  users: {
    description: "Tashkilotdagi foydalanuvchilarni ko‘ring va boshqaring.",
    active: "Faol",
    inactive: "Nofaol",
    columns: {
      name: "Ism",
      role: "Rol",
      status: "Holat",
      lastLogin: "Oxirgi kirish",
      email: "Email",
      phone: "Telefon",
    },
  },
};

export type Messages = typeof uz;
