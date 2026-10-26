// /hoi-vien — Hội viên năm (SAO-HV, migration 0028; docs/DANH-GIA-VIRAL-V2-VA-KINH-DOANH.md §3, §9 cách tiếp cận B).
// Mua MỘT LẦN bằng VND qua QR payOS → không tự gia hạn, không trừ tiền định kỳ. Quyền lợi + giá + chính sách hoàn tiền ghi
// rõ; công tắc sao.hoi_vien.bat tắt → trang vẫn có (noindex) nhưng nút ẩn, dòng "sắp mở". Không đếm ngược, không "ưu đãi",
// không gạch giá. Giá hiển thị đọc từ cùng cài đặt mà máy chủ dùng khi tạo đơn.
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, CalendarCheck, MessageCircleQuestion, Sparkles } from "lucide-react";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { lopKieuChu } from "@/lib/kieu-chu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { layCauHinh } from "@/lib/cau-hinh";
import { congDangBat } from "@/lib/thanh-toan/cong";
import { HOAN_TIEN_HOI_VIEN, giaMoiThang, vnd } from "@/lib/thanh-toan/hoi-vien";
import { MuaHoiVien } from "./MuaHoiVien";

const DUONG = "/hoi-vien";

export async function generateMetadata(): Promise<Metadata> {
  const bat = await layCauHinh<boolean>("sao.hoi_vien.bat").catch(() => false);
  return apDungSeo({ ...metaMacDinh(DUONG), robots: bat ? { index: true, follow: true } : { index: false, follow: true } },
    await layNoiDungTrang(DUONG));
}

export default async function Page() {
  const [bat, gia, saoThang, cauHoi, nd] = await Promise.all([
    layCauHinh<boolean>("sao.hoi_vien.bat").catch(() => false),
    layCauHinh<number>("sao.hoi_vien.gia_vnd").catch(() => 3990000),
    layCauHinh<number>("sao.hoi_vien.sao_thang").catch(() => 15),
    layCauHinh<number>("sao.hoi_vien.cau_hoi_nam").catch(() => 2),
    layNoiDungTrang(DUONG),
  ]);
  const cong = congDangBat();
  const quyenLoi = [
    { Icon: BookOpenText, tieuDe: "Mở mọi chương Luận giải toàn bộ", mo_ta: "Tử vi · Bát tự · Bản đồ con số: đọc trọn báo cáo của bạn và của hồ sơ bạn nhập, không trừ Sao, trong suốt thời hạn hội viên." },
    { Icon: Sparkles, tieuDe: `${saoThang} Sao tặng mỗi tháng`, mo_ta: "Cấp vào đầu mỗi tháng (hoặc lần đầu bạn mở trang trong tháng) để hỏi đáp vượt lượt miễn phí. Sao tháng dùng trong tháng đó, không cộng dồn sang tháng sau. Sao bạn đã mua vẫn giữ, không hết hạn." },
    { Icon: MessageCircleQuestion, tieuDe: `${cauHoi} câu hỏi chuyên gia mỗi năm`, mo_ta: "Dùng khi mục Hỏi chuyên gia mở: người thật trả lời bằng văn bản. Lượt chưa dùng không cộng dồn sang năm sau." },
    { Icon: CalendarCheck, tieuDe: "Mua một lần, không tự gia hạn", mo_ta: "Trả một lần cho 365 ngày bằng QR chuyển khoản. Hết hạn thì bạn tự quyết có gia hạn hay không — không trừ tiền tự động." },
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Hội viên</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">{nd.dau.h1 ?? "Hội viên năm"}</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        {nd.dau.loiDan ? <span className={lopKieuChu(nd.dau.kieuChu) || undefined}>{nd.dau.loiDan}</span> : <>
        Dành cho người muốn đọc trọn mọi luận giải trong cả năm mà không phải nạp Sao từng lần. Phần lớn công cụ vẫn miễn phí
        cho mọi người; hội viên chỉ mở thêm các báo cáo chuyên sâu.
        </>}
      </p>
      <KhoiCms ds={nd.khoi.tren} duong={DUONG} viTri="tren" className="mt-8" />

      <section className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Quyền lợi hội viên" data-testid="hoi-vien-quyen-loi">
        {quyenLoi.map(({ Icon, tieuDe, mo_ta }) => (
          <div key={tieuDe} className="glass rounded-2xl p-5">
            <Icon className="size-6 text-gold" aria-hidden />
            <h2 className="mt-3 font-serif text-xl text-fg">{tieuDe}</h2>
            <p className="mt-1 text-sm text-fg-muted">{mo_ta}</p>
          </div>
        ))}
      </section>

      <section className="glass mt-8 rounded-2xl p-6" aria-labelledby="gia-hoi-vien">
        <h2 id="gia-hoi-vien" className="font-serif text-xl">Giá</h2>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="font-serif text-4xl text-gold" data-testid="gia-hoi-vien">{vnd(gia)}</span>
          <span className="text-fg-muted">/ 365 ngày · mua một lần, không tự gia hạn</span>
        </p>
        <p className="mt-1 text-sm text-fg-faint">Tương đương khoảng {vnd(giaMoiThang(gia))} mỗi tháng (quy đổi để bạn so sánh; không bán theo tháng).</p>
        <MuaHoiVien bat={bat} cong={cong} gia={gia} />
      </section>

      <section className="mt-10 space-y-2 text-sm leading-relaxed text-fg-muted" aria-labelledby="hoan-tien">
        <h2 id="hoan-tien" className="font-serif text-xl text-fg">Hoàn tiền</h2>
        <ul className="list-disc space-y-1.5 pl-5" data-testid="hoi-vien-hoan-tien">
          {HOAN_TIEN_HOI_VIEN.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p>Chi tiết ở <Link href="/dieu-khoan#hoi-vien" className="text-gold hover:underline">Điều khoản sử dụng, mục Hội viên năm</Link>.</p>
      </section>

      <section className="mt-10 space-y-2 text-sm leading-relaxed text-fg-muted" aria-label="Điều cần biết">
        <h2 className="font-serif text-xl text-fg">Điều cần biết</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Hội viên gắn với tài khoản của bạn; cần đăng nhập để mua và để hệ thống nhận ra bạn khi đọc báo cáo.</li>
          <li>Đang là hội viên thì không mua chồng; gia hạn mở khi còn 30 ngày trở xuống, nối tiếp đúng hạn hiện tại.</li>
          <li>Sao là điểm dùng trong Hiểu Bản Thân: không đổi ra tiền, không chuyển cho người khác. Hội viên không thay đổi điều đó.</li>
          <li>Quét mã QR bằng app ngân hàng hoặc ví điện tử có VietQR. Đừng sửa số tiền hay nội dung chuyển khoản. Trả rồi mà chưa thấy kích hoạt sau 10 phút: gửi mã đơn qua <Link href="/lien-he" className="text-gold hover:underline">trang Liên hệ</Link>.</li>
          <li>Muốn nạp lẻ thay vì hội viên: <Link href="/nap-sao" className="text-gold hover:underline">Nạp Sao</Link>.</li>
        </ul>
      </section>
      <KhoiCms ds={nd.khoi.duoi} duong={DUONG} viTri="duoi" className="mt-10" />
      <KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-10" />
    </div>
  );
}
