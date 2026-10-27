// /hoi-vien — Hội viên năm HAI HẠNG: thường + Chuyên gia (SAO-HV, migration 0028; docs/DANH-GIA-VIRAL-V2-VA-KINH-DOANH.md §3, §9 cách tiếp cận B).
// Mua MỘT LẦN bằng VND qua QR payOS → không tự gia hạn, không trừ tiền định kỳ. Quyền lợi + giá + chính sách hoàn tiền ghi
// rõ; công tắc sao.hoi_vien.bat tắt (hoặc chưa có cổng) → trang vẫn có (noindex) nhưng chỉ một khung "Sắp có" gọn, không giá
// (rà UX mục 17). Không đếm ngược, không "ưu đãi", không gạch giá. Giá hiển thị đọc từ cùng cài đặt mà máy chủ dùng khi tạo đơn.
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, CalendarCheck, Sparkles } from "lucide-react";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { SapCo } from "@/components/khung/SapCo";
import { lopKieuChu } from "@/lib/kieu-chu";
import { apDungSeo, layNoiDungTrang, metaMacDinh } from "@/lib/noi-dung-trang";
import { layCauHinh } from "@/lib/cau-hinh";
import { congDangBat } from "@/lib/thanh-toan/cong";
import { HOAN_TIEN_HOI_VIEN } from "@/lib/thanh-toan/hoi-vien";
import { ChonHangHoiVien, type HangBan } from "./MuaHoiVien";

const DUONG = "/hoi-vien";

export async function generateMetadata(): Promise<Metadata> {
  const bat = await layCauHinh<boolean>("sao.hoi_vien.bat").catch(() => false);
  return apDungSeo({ ...metaMacDinh(DUONG), robots: bat ? { index: true, follow: true } : { index: false, follow: true } },
    await layNoiDungTrang(DUONG));
}

export default async function Page() {
  // Cùng khoá + mặc định với SQL hv_goi (0028) — số hiển thị = số máy chủ dùng khi tạo đơn.
  const [bat, gia, saoThang, cauHoi, cgBat, cgGia, cgCau, cgGio, cgMo, hanChung, nd] = await Promise.all([
    layCauHinh<boolean>("sao.hoi_vien.bat").catch(() => false),
    layCauHinh<number>("sao.hoi_vien.gia_vnd").catch(() => 399000),
    layCauHinh<number>("sao.hoi_vien.sao_thang").catch(() => 15),
    layCauHinh<number>("sao.hoi_vien.cau_hoi_nam").catch(() => 1),
    layCauHinh<boolean>("sao.hoi_vien.cg.bat").catch(() => false),
    layCauHinh<number>("sao.hoi_vien.cg.gia_vnd").catch(() => 1990000),
    layCauHinh<number>("sao.hoi_vien.cg.cau_hoi_nam").catch(() => 6),
    layCauHinh<number>("sao.hoi_vien.cg.han_gio").catch(() => 24),
    layCauHinh<boolean>("sao.chuyen_gia.bat").catch(() => false),
    layCauHinh<number>("sao.chuyen_gia.han_gio").catch(() => 48),
    layNoiDungTrang(DUONG),
  ]);
  const cong = congDangBat();
  // Rà UX mục 17: chưa mua được (công tắc tắt HOẶC chưa có cổng thanh toán) → không bày giá to; một khung "Sắp có" gọn.
  if (!bat || !cong) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Hội viên</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">{nd.dau.h1 ?? "Hội viên năm"}</h1>
        <SapCo testId="hoi-vien-chua-mo"
          moTa="Hội viên năm sẽ mở mọi chương Luận giải toàn bộ trong một năm. Mục này chưa mở nên chưa mua được."
          trongLucCho="Trong lúc chờ, phần lớn công cụ vẫn miễn phí cho mọi người." />
      </div>
    );
  }
  // Phần CHUNG cả hai hạng (ghi một lần); điều khác nhau nằm trong từng thẻ hạng.
  const quyenLoi = [
    { Icon: BookOpenText, tieuDe: "Mở mọi chương Luận giải toàn bộ", mo_ta: "Tử vi · Bát tự · Bản đồ con số: đọc trọn báo cáo của bạn và của hồ sơ bạn nhập, không trừ Sao, trong suốt thời hạn hội viên." },
    { Icon: Sparkles, tieuDe: `${saoThang} Sao tặng mỗi tháng`, mo_ta: "Cấp vào đầu mỗi tháng (hoặc lần đầu bạn mở trang trong tháng) để hỏi đáp vượt lượt miễn phí. Sao tháng dùng trong tháng đó, không cộng dồn sang tháng sau. Sao bạn đã mua vẫn giữ, không hết hạn." },
    { Icon: CalendarCheck, tieuDe: "Mua một lần, không tự gia hạn", mo_ta: "Trả một lần cho 365 ngày bằng QR chuyển khoản. Hết hạn thì bạn tự quyết có gia hạn hay không — không trừ tiền tự động. Câu hỏi chuyên gia chưa dùng không cộng dồn sang năm sau." },
  ];
  const hang: HangBan[] = [
    { hang: "thuong", bat: true, gia, cauHoi, hanGio: null },
    { hang: "chuyen_gia", bat: cgBat && cgMo, gia: cgGia, cauHoi: cgCau, hanGio: Math.min(cgGio, hanChung) },
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

      <h2 className="mt-8 font-serif text-xl">Cả hai hạng đều có</h2>
      <section className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Quyền lợi chung của hội viên" data-testid="hoi-vien-quyen-loi">
        {quyenLoi.map(({ Icon, tieuDe, mo_ta }) => (
          <div key={tieuDe} className="glass rounded-2xl p-5">
            <Icon className="size-6 text-gold" aria-hidden />
            <h3 className="mt-3 font-serif text-lg text-fg">{tieuDe}</h3>
            <p className="mt-1 text-sm text-fg-muted">{mo_ta}</p>
          </div>
        ))}
      </section>

      <section className="mt-8" aria-label="Chọn hạng" data-testid="mua-hoi-vien">
        <ChonHangHoiVien cong={cong} hang={hang} hanChung={hanChung} />
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
          <li>Đang là hội viên thì không mua chồng; gia hạn mở khi còn 30 ngày trở xuống, nối tiếp đúng hạn hiện tại và giữ hạng đang dùng.</li>
          <li>Đang ở hạng thường muốn nâng lên Chuyên gia: giá đã trừ phần còn lại của gói hiện tại, bạn nhận kỳ mới 365 ngày từ hôm nâng.</li>
          <li>Quyền lợi giữ đúng như lúc bạn mua — mức công bố đổi sau đó không làm giảm quyền lợi của bạn.</li>
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
