interface SkipLinkProps {
  locale: string;
}

export default function SkipLink({ locale }: SkipLinkProps) {
  const label = locale === "kk" ? "Негізгі мазмұнға өту" : "Перейти к основному содержимому";
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-purple-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg"
    >
      {label}
    </a>
  );
}
