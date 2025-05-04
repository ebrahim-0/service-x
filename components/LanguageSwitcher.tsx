"use client";

import { useLocale } from "next-intl";
import { Button } from "./ui/button";
import { useParams, useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const lang = useLocale();
  const { replace } = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const toggleLanguage = () => {
    const newLang = lang === "ar" ? "en" : "ar";

    const query = new URLSearchParams(searchParams.toString());
    const newUrl = `${pathname}?${query.toString()}`;
    replace(newUrl, { ...params, locale: newLang });
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage}>
      {lang === "ar" ? "English" : "العربية"}
    </Button>
  );
}
