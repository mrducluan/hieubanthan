// QT-2 — Cài đặt site: công tắc + chiến dịch mời + dải thông báo. Chủ sở hữu sửa, vai trò khác chỉ xem.
// Đọc thẳng bảng cau_hinh bằng phiên quản trị (RLS: chỉ người có vai trò aal2) để thấy ai sửa lúc nào.
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri } from "@/lib/quan-tri";
import { CAI_DAT, giaTriHieuLuc } from "@/lib/cau-hinh";
import { CaiDat, type DongCaiDat } from "./CaiDat";

export const metadata: Metadata = { title: "Cài đặt site" };

export default async function Page() {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  const { data, error } = await p.sb.from("cau_hinh").select("khoa, gia_tri, cap_nhat_luc");
  const luu: Record<string, unknown> = {}, luc: Record<string, string> = {};
  for (const d of data ?? []) { luu[d.khoa] = d.gia_tri; luc[d.khoa] = d.cap_nhat_luc; }
  const dong: DongCaiDat[] = CAI_DAT.map((c) => ({
    c, daLuu: c.khoa in luu, hieuLuc: giaTriHieuLuc(c, luu), luc: luc[c.khoa] ?? null,
  }));
  return (
    <div className="space-y-6" data-testid="qt-cai-dat">
      <div>
        <h1 className="text-2xl">Cài đặt site</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Có hiệu lực trong khoảng 1 phút, không cần triển khai lại. Mỗi lần lưu ghi nhật ký (giá trị cũ → mới).
          Khoá bí mật vẫn chỉ đặt ở Vercel/Render.
        </p>
      </div>
      {error && <Card><p role="alert" className="text-sm text-cinnabar">Chưa đọc được bảng cài đặt (đã chạy migration 0010 chưa?).</p></Card>}
      <CaiDat dong={dong} duocSua={p.vaiTro === "chu_so_huu"} />
    </div>
  );
}
