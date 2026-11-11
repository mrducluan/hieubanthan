// QTE — trang 404 bản tiếng Anh (notFound() trong /en và mọi URL lạ dưới /en qua [...khac]) — khung tiếng Anh của layout gốc,
// không lọt chữ Việt; noindex.
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: { absolute: "Page not found — Hieuban" }, robots: { index: false, follow: true } };

export default function NotFoundEn() {
  return (
    <div className="mx-auto max-w-md py-16 text-center" data-testid="khong-tim-thay-en">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl">This page is not on our star map</h1>
      <p className="mt-3 text-fg-muted">The link may be mistyped or the page has moved. Anything you saved stays in your browser.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild><Lien href="/en/numerology">Numerology</Lien></Button>
        <Button asChild variant="secondary"><Lien href="/en/tarot">Tarot</Lien></Button>
      </div>
      <p className="mt-6 text-sm text-fg-muted"><Lien href="/en" className="text-gold hover:underline">English home</Lien> · <Lien href="/" hrefLang="vi" className="text-gold hover:underline">Tiếng Việt</Lien></p>
    </div>
  );
}
