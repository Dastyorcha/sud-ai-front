import { motion } from "motion/react";
import { useTranslation } from "@/shared/lib/i18n/locale-context";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className="min-h-screen flex flex-col items-center justify-center gap-4 from-primary via-primary/90 to-primary/80 px-4 pt-20 text-center"
    >
      <iframe
        title={t("errors.notFoundTitle")}
        src="https://lottie.host/embed/8e43d0ae-d848-4bba-a7e6-f4f28c2959fc/gTJT7Xilv0.lottie"
        style={{ width: "90%", height: "auto", aspectRatio: "16/9" }}
      ></iframe>
      <div>
        <h1 className="text-foreground text-xl font-semibold">{t("errors.notFoundTitle")}</h1>
        <p className="text-muted-foreground mt-1 max-w-prose">{t("errors.notFoundDescription")}</p>
      </div>
    </motion.div>
  );
}
