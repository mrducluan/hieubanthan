// PL-1 — Liên hệ. Thông tin lấy từ env (lib/van-hanh.ts); thiếu thì ghi "đang cập nhật".
import type { Metadata } from "next";
import { KhoiCms } from "@/components/cms/KhoiCms";
import { gopMucCms, LoiDanCms } from "@/components/cms/DauTrangCms";
import { apDungSeo, layNoiDungTrang } from "@/lib/noi-dung-trang";
import Link from "next/link";
import { Mail, MapPin, MessageSquareHeart, Phone, ShieldCheck } from "lucide-react";
import { TrangPhapLy, type Muc } from "@/components/phap-ly/TrangPhapLy";
import { DANG_CAP_NHAT, vanHanh } from "@/lib/van-hanh";

const META: Metadata = {
  title: "Liên hệ",
  description: "Liên hệ Hiểu Bản Thân: góp ý, báo lỗi, yêu cầu về dữ liệu cá nhân, hợp tác.",
  alternates: { canonical: "/lien-he" },
};

function Thu({ email, chuDe, nhan }: { email: string | null; chuDe: string; nhan: string }) {
  if (!email) return <span className="text-fg-faint">{nhan}: {DANG_CAP_NHAT}</span>;
  return <a className="text-gold underline" href={`mailto:${email}?subject=${encodeURIComponent(chuDe)}`}>{nhan}</a>;
}

const DUONG = "/lien-he";

export async function generateMetadata(): Promise<Metadata> {
  return apDungSeo(META, await layNoiDungTrang(DUONG));
}

export default async function LienHe() {
  const vh = vanHanh(), nd = await layNoiDungTrang(DUONG);
  const muc: Muc[] = [
    {
      id: "thong-tin", tieuDe: "Thông tin liên hệ",
      noiDung: (
        <ul className="!list-none !pl-0 space-y-2">
          <li className="flex gap-2"><Mail className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
            Email: {vh.email ? <a className="text-gold underline" href={`mailto:${vh.email}`}>{vh.email}</a> : DANG_CAP_NHAT}</li>
          <li className="flex gap-2"><Phone className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
            Điện thoại / Zalo: {vh.dienThoai ? <a className="text-gold underline" href={`tel:${vh.dienThoai.replace(/\s/g, "")}`}>{vh.dienThoai}</a> : DANG_CAP_NHAT}</li>
          <li className="flex gap-2"><MapPin className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
            Địa chỉ: {vh.diaChi ?? DANG_CAP_NHAT}</li>
          {vh.chuSoHuu && <li className="text-sm text-fg-faint">Đơn vị vận hành: {vh.chuSoHuu}{vh.maSo ? ` · Mã số ${vh.maSo}` : ""}</li>}
        </ul>
      ),
    },
    {
      id: "chu-de", tieuDe: "Bạn cần gì?",
      noiDung: (
        <ul className="!list-none !pl-0 space-y-3">
          <li className="flex gap-2"><MessageSquareHeart className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
            <span><b>Góp ý, báo lỗi tính hay lỗi nội dung</b>: <Thu email={vh.email} chuDe="Góp ý / báo lỗi Hiểu Bản Thân" nhan="Gửi góp ý" />.
              Nếu báo sai kết quả, hãy ghi trang đang xem và trường phái đang chọn; không cần gửi ngày sinh nếu bạn không muốn.</span></li>
          <li className="flex gap-2"><ShieldCheck className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
            <span><b>Yêu cầu về dữ liệu cá nhân</b> (xem, sửa, xoá, rút đồng ý): <Thu email={vh.emailDuLieu} chuDe="Yêu cầu dữ liệu cá nhân" nhan="Gửi yêu cầu" />.
              Xoá tài khoản bạn tự làm được ngay ở mục <Link href="/tai-khoan" className="text-gold underline">Tài khoản</Link>.</span></li>
          <li className="flex gap-2"><Mail className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
            <span><b>Hợp tác, báo chí, người có chuyên môn muốn duyệt nội dung</b>: <Thu email={vh.email} chuDe="Hợp tác với Hiểu Bản Thân" nhan="Gửi thư" />.</span></li>
        </ul>
      ),
    },
  ];
  return (
    <TrangPhapLy nhan="Về chúng tôi" tieuDe={nd.dau.h1 ?? "Liên hệ"} duongDan={DUONG} muc={gopMucCms(muc, nd)} hieuLuc={false}
      khoiCuoi={<KhoiCms ds={nd.khoi.cuoi} duong={DUONG} viTri="cuoi" className="mt-12" />}
      moDau={<LoiDanCms nd={nd}>Chúng tôi đọc mọi thư và trả lời trong giờ hành chính, thường trong vòng 2 ngày làm việc.</LoiDanCms>} />
  );
}
