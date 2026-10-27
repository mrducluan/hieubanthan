// SAO-CG (0029) — /hoi-chuyen-gia: đặt MỘT câu hỏi cho chuyên gia Đức Luân, trả VND cố định (KHÔNG bằng Sao — CG-1),
// trả lời bằng văn bản trong N giờ hoặc hoàn 100%. Công tắc sao.chuyen_gia.bat tắt → trang vẫn có (noindex) nhưng chỉ một
// khung "Sắp có" gọn, không giá (rà UX mục 17). Máy chủ đọc công tắc + giá để dựng H1/SEO; trình duyệt hỏi lại
// /api/chuyen-gia/thong-tin kèm token để biết lần đầu / hội viên — phần giới thiệu, cách hoạt động, giá nằm trong
// HoiChuyenGia để hiện theo đúng trạng thái đó.
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHUYEN_GIA, duongChuyenGia, ldNguoi } from "@/lib/chuyen-gia";
import { thongTinChuyenGia } from "@/lib/chuyen-gia-may-chu";
import { goiLd, ldDuongDan, metaTrang } from "@/lib/seo";
import { HoiChuyenGia } from "./HoiChuyenGia";

const DUONG = "/hoi-chuyen-gia";
const TIEU_DE = "Hỏi chuyên gia — một câu hỏi, trả lời trong 48 giờ";
const MO_TA = "Đặt một câu hỏi về thần số học, Tử vi, Bát tự, Kinh Dịch hoặc phong thuỷ cho chuyên gia Đức Luân. Trả lời bằng văn bản trong 48 giờ, quá hạn hoàn 100%. Giá cố định, thanh toán QR.";

export async function generateMetadata(): Promise<Metadata> {
  const tt = await thongTinChuyenGia();
  return { ...metaTrang({ tieuDe: TIEU_DE, moTa: MO_TA, duong: DUONG }), robots: tt.bat ? { index: true, follow: true } : { index: false, follow: true } };
}

export default async function Page() {
  const tt = await thongTinChuyenGia();
  const cg = CHUYEN_GIA["duc-luan"]!;
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Hỏi chuyên gia", duong: DUONG }]), ldNguoi(cg))} />
      <p className="eyebrow">Hỏi chuyên gia</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">Một câu hỏi, một câu trả lời của người thật</h1>
      <HoiChuyenGia banDau={tt} nguoi={
        <section className="glass mt-8 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-start" aria-labelledby="cg-nguoi">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold/15 font-serif text-2xl text-gold" aria-hidden>ĐL</div>
          <div className="min-w-0">
            <h2 id="cg-nguoi" className="font-serif text-2xl">{cg.ten}</h2>
            <p className="text-sm text-fg-muted">{cg.vaiTro} · {cg.tomTat}</p>
            <p className="mt-2 text-sm text-fg-muted">{cg.gioiThieu[2]}</p>
            <Link href={duongChuyenGia(cg.slug)} className="mt-2 inline-block text-sm text-gold hover:underline">Hồ sơ chuyên gia →</Link>
          </div>
        </section>
      } />
    </div>
  );
}
