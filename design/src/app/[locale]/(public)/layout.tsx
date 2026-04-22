import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import ChatWidget from "@/components/features/ChatWidget";
import { AgeProfileProvider } from "@/lib/age-profile";
import AccessibilityToolbar from "@/components/layout/AccessibilityToolbar";
import SkipLink from "@/components/layout/SkipLink";
import ServiceWorkerRegister from "@/components/features/ServiceWorkerRegister";
import VisitTracker from "@/components/features/VisitTracker";
import { JsonLd, organizationSchema } from "@/lib/jsonld";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  return (
    <SessionProviderWrapper>
      <AgeProfileProvider>
        <JsonLd data={organizationSchema()} />
        <SkipLink locale={validLocale} />
        <Header locale={validLocale} messages={messages as Record<string, Record<string, string>>} />
        <Breadcrumbs />
        <main id="main" tabIndex={-1} className="flex-1 pb-20 lg:pb-0 outline-none">
          {children}
        </main>
        <Footer locale={validLocale} messages={messages as Record<string, Record<string, string>>} />
        <BottomNav locale={validLocale} />
        <ChatWidget locale={validLocale} />
        <AccessibilityToolbar locale={validLocale} />
        <ServiceWorkerRegister />
        <VisitTracker locale={validLocale} />
      </AgeProfileProvider>
    </SessionProviderWrapper>
  );
}
