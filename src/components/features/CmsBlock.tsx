import { getCmsPage, pickField } from "@/lib/cms";
import Card from "@/components/ui/Card";

/**
 * Server component: тянет страницу из cms_pages по slug и рендерит её HTML-контент.
 * Если CMS-записи нет — компонент молча ничего не отрисовывает (fallback на статику страницы).
 */
export default async function CmsBlock({ slug, locale }: { slug: string; locale: string }) {
  let page = null;
  try {
    page = await getCmsPage(slug);
  } catch {
    return null;
  }
  if (!page) return null;
  const title = pickField(page, "title", locale);
  const content = pickField(page, "content", locale);
  if (!content) return null;

  return (
    <Card className="p-6 md:p-8 prose prose-purple max-w-none">
      {title && <h2 className="text-xl font-bold text-purple-900 mb-3">{title}</h2>}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Card>
  );
}
