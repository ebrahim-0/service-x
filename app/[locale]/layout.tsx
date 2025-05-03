import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ToggleLayoutProvider } from "@/context/toggle-menu.context";
import StateProvider from "@/store/StateProvider";
import { Toaster } from "@/components/ui/sonner";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} dir={locale === "en" ? "ltr" : "rtl"}>
      <body>
        <StateProvider>
          <ToggleLayoutProvider>
            <NextIntlClientProvider>
              {children}
              <Toaster position={locale === "en" ? "top-right" : "top-left"} />
            </NextIntlClientProvider>
          </ToggleLayoutProvider>
        </StateProvider>
      </body>
    </html>
  );
}
