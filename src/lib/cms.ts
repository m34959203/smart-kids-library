import { getOne } from "./db";

export interface CmsPage {
  id: number;
  slug: string;
  title_ru: string;
  title_kk: string | null;
  content_ru: string;
  content_kk: string | null;
  meta_description_ru: string | null;
  meta_description_kk: string | null;
  updated_at: string;
}

export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  return getOne<CmsPage>("SELECT * FROM cms_pages WHERE slug = $1", [slug]);
}

export function pickField(page: CmsPage | null, field: "title" | "content" | "meta_description", locale: string): string {
  if (!page) return "";
  const kk = (page[`${field}_kk` as keyof CmsPage] as string | null) || "";
  const ru = (page[`${field}_ru` as keyof CmsPage] as string | null) || "";
  return locale === "kk" && kk ? kk : ru;
}
