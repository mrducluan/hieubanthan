// Nhúng JSON-LD (schema.org) cho máy tìm kiếm và AI. Escape "<" để không đóng thẻ script sớm.
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}
