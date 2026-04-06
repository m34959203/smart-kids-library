import { isValidLocale, type Locale, getMessages, t } from "@/lib/i18n";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default async function AdminCatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ru";
  const messages = await getMessages(validLocale);

  const sampleBooks = [
    { id: 1, title: "Маленький принц", author: "А. Сент-Экзюпери", genre: "Повесть", age: "10-13", available: true },
    { id: 2, title: "Гарри Поттер", author: "Дж. Роулинг", genre: "Фэнтези", age: "10-13", available: true },
    { id: 3, title: "Абай жолы", author: "М. Ауэзов", genre: "Роман", age: "14-17", available: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-900">{t(messages, "admin.catalog")}</h1>
        <Button>{validLocale === "kk" ? "Кітап қосу" : "Добавить книгу"}</Button>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-purple-50">
            <tr>
              <th className="text-left p-3 text-purple-700">ID</th>
              <th className="text-left p-3 text-purple-700">{validLocale === "kk" ? "Атауы" : "Название"}</th>
              <th className="text-left p-3 text-purple-700">{validLocale === "kk" ? "Автор" : "Автор"}</th>
              <th className="text-left p-3 text-purple-700">{validLocale === "kk" ? "Жанр" : "Жанр"}</th>
              <th className="text-left p-3 text-purple-700">{validLocale === "kk" ? "Жас" : "Возраст"}</th>
              <th className="text-left p-3 text-purple-700">{validLocale === "kk" ? "Статус" : "Статус"}</th>
              <th className="text-left p-3 text-purple-700"></th>
            </tr>
          </thead>
          <tbody>
            {sampleBooks.map((book) => (
              <tr key={book.id} className="border-t border-gray-100 hover:bg-purple-50/50">
                <td className="p-3">{book.id}</td>
                <td className="p-3 font-medium">{book.title}</td>
                <td className="p-3 text-gray-500">{book.author}</td>
                <td className="p-3">{book.genre}</td>
                <td className="p-3">{book.age}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${book.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {book.available ? (validLocale === "kk" ? "Бар" : "Доступна") : (validLocale === "kk" ? "Жоқ" : "Недоступна")}
                  </span>
                </td>
                <td className="p-3">
                  <Button variant="ghost" size="sm">{validLocale === "kk" ? "Өңдеу" : "Редактировать"}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
