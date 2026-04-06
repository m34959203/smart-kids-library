import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function AdminNewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const news = [
    { id: 1, title: "Новые книги поступили!", status: "published", date: "01.04.2026" },
    { id: 2, title: "Читательский марафон", status: "published", date: "28.03.2026" },
    { id: 3, title: "Летняя программа", status: "draft", date: "20.03.2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{t(messages, "admin.news")}</h1>
        <Button>{validLocale === "kk" ? "Жаңалық қосу" : "Добавить новость"}</Button>
      </div>
      <div className="space-y-3">
        {news.map((item) => (
          <Card key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {item.status === "published" ? (validLocale === "kk" ? "Жарияланды" : "Опубликовано") : (validLocale === "kk" ? "Жоба" : "Черновик")}
              </span>
              <Button variant="ghost" size="sm">{validLocale === "kk" ? "Өңдеу" : "Редактировать"}</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
