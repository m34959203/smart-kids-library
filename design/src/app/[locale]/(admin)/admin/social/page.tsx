import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default async function AdminSocialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const posts = [
    { id: 1, title: "Новые книги", platform: "telegram", status: "posted", date: "01.04.2026" },
    { id: 2, title: "Мастер-класс", platform: "instagram", status: "scheduled", date: "10.04.2026" },
    { id: 3, title: "Конкурс чтецов", platform: "telegram", status: "failed", date: "05.04.2026" },
  ];

  const statusVariants: Record<string, "success" | "warning" | "danger"> = { posted: "success", scheduled: "warning", failed: "danger" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{t(messages, "admin.social")}</h1>
        <Button>{validLocale === "kk" ? "Пост жасау" : "Создать пост"}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 text-center">
          <h3 className="font-bold text-purple-900">Telegram</h3>
          <p className="text-3xl font-bold text-blue-500 mt-2">@smartkidslibrary</p>
          <p className="text-sm text-gray-400 mt-1">{validLocale === "kk" ? "Қосылған" : "Подключен"}</p>
        </Card>
        <Card className="p-6 text-center">
          <h3 className="font-bold text-purple-900">Instagram</h3>
          <p className="text-3xl font-bold text-pink-500 mt-2">@smartkidslibrary</p>
          <p className="text-sm text-gray-400 mt-1">{validLocale === "kk" ? "Қосылған" : "Подключен"}</p>
        </Card>
      </div>
      <h2 className="text-lg font-bold text-purple-900">{validLocale === "kk" ? "Соңғы посттар" : "Последние посты"}</h2>
      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900">{post.title}</h3>
              <p className="text-sm text-gray-400">{post.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{post.platform}</Badge>
              <Badge variant={statusVariants[post.status] ?? "default"}>{post.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
