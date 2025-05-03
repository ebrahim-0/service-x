import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations("trans");
  return (
    <div>
      <h1>{t("sidebar.users")}</h1>
      <Link href="/about">{t("sidebar.users")}</Link>
    </div>
  );
}
