// SAO-CG (0029) — /hoi-chuyen-gia: đặt MỘT câu hỏi cho chuyên gia Đức Luân, trả VND cố định (KHÔNG bằng Sao — CG-1),
// trả lời bằng văn bản trong N giờ hoặc hoàn 100 %. Công tắc sao.chuyen_gia.bat tắt → trang vẫn có (noindex), nút "sắp mở".
// Máy chủ chỉ đọc công tắc + giá để dựng H1/SEO; trình duyệt hỏi lại /api/chuyen-gia/thong-tin kèm token để biết lần đầu / hội viên.
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { CHUYEN_GIA, duongChuyenGia, ldNguoi } from "@/lib/chuyen-gia";
import { thongTinChuyenGia } from "@/lib/chuyen-gia-may-chu";
import { dinhDangVnd } from "@/lib/chuyen-gia-hoi";
import { goiLd, ldDuongDan, metaTrang } from "@/lib/seo";
import { HoiChuyenGia } from "./HoiChuyenGia";

const DUONG = "/hoi-chuyen-gia";
const TIEU_DE = "Hỏi chuyên gia — một câu hỏi, trả lời trong 48 giờ";
const MO_TA = "Đặt một câu hỏi về thần số học, Tử vi, Bát tự, Kinh Dịch hoặc phong thuỷ cho chuyên gia Đức Luân. Trả lời bằng văn bản trong 48 giờ, quá hạn hoàn 100 %. Giá cố định, thanh toán QR.";

export async function generateMetadata(): Promise<Metadata> {
  const tt = await thongTinChuyenGia();
  return { ...metaTrang({ tieuDe: TIEU_DE, moTa: MO_TA, duong: DUONG }), robots: tt.bat ? { index: true, follow: true } : { index: false, follow: true } };
}

export default async function Page() {
  const tt = await thongTinChuyenGia();
  const cg = CHUYEN_GIA["duc-luan"]!;
  const han = tt.han_gio;
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Hỏi chuyên gia", duong: DUONG }]), ldNguoi(cg))} />
      <p className="eyebrow">Hỏi chuyên gia</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">Một câu hỏi, một câu trả lời của người thật</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        Bạn đang vướng một việc cụ thể — đổi việc, chọn thời điểm, một mối quan hệ, cách bố trí nhà? Đặt một câu hỏi, chuyên gia đọc
        hồ sơ của bạn (nếu bạn cho phép) và trả lời bằng văn bản trong <b className="text-fg">{han} giờ</b>. Quá hạn, bạn được hoàn 100 %.
      </p>

      <section className="glass mt-8 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-start" aria-labelledby="cg-nguoi">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold/15 font-serif text-2xl text-gold" aria-hidden>ĐL</div>
        <div className="min-w-0">
          <h2 id="cg-nguoi" className="font-serif text-2xl">{cg.ten}</h2>
          <p className="text-sm text-fg-muted">{cg.vaiTro} · {cg.tomTat}</p>
          <p className="mt-2 text-sm text-fg-muted">{cg.gioiThieu[2]}</p>
          <Link href={duongChuyenGia(cg.slug)} className="mt-2 inline-block text-sm text-gold hover:underline">Hồ sơ chuyên gia →</Link>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="cg-cach">
        <h2 id="cg-cach" className="font-serif text-2xl">Cách hoạt động</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["1. Bạn hỏi", "Chọn mảng, viết một câu hỏi cụ thể (tối đa 1.500 ký tự). Tự quyết có chia sẻ ngày giờ sinh hay không."],
            ["2. Thanh toán", `Giá cố định ${dinhDangVnd(tt.gia_vnd)}${tt.giam_lan_dau_pt > 0 ? `, câu đầu giảm ${tt.giam_lan_dau_pt} % còn ${dinhDangVnd(tt.gia_lan_dau)}` : ""}. Quét QR bằng app ngân hàng.`],
            [`3. Trả lời trong ${han} giờ`, "Chuyên gia viết riêng cho bạn, đọc ở mục Tài khoản → Câu hỏi của tôi. Quá hạn → hoàn 100 %."],
          ].map(([t, m]) => (
            <li key={t} className="glass rounded-2xl p-4"><p className="font-semibold text-fg">{t}</p><p className="mt-1 text-sm text-fg-muted">{m}</p></li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-fg-muted" data-testid="cg-cam-ket">
          <b className="text-fg">Cam kết:</b> trả lời trong {han} giờ kể từ lúc thanh toán, hoặc hoàn 100 % tiền. Thanh toán bằng đồng, không dùng Sao.
          Đây là góc nhìn tham khảo — không thay bác sĩ, luật sư hay chuyên gia tài chính; không chẩn đoán bệnh, không đoán xổ số, không nói ngày chết.
          Chi tiết ở <Link href="/dieu-khoan#chuyen-gia" className="text-gold underline">Điều khoản</Link> và{" "}
          <Link href="/chinh-sach-rieng-tu#du-lieu" className="text-gold underline">Chính sách quyền riêng tư</Link>.
        </p>
      </section>

      <HoiChuyenGia banDau={tt} />
    </div>
  );
}
