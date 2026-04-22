import { getMessages, isValidLocale, type Locale } from "@/lib/i18n";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);
  const adminMessages = (messages.admin ?? {}) as Record<string, string>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar locale={validLocale} messages={adminMessages} />
      <div className="flex-1 p-6 overflow-auto">{children}</div>
    </div>
  );
}
