// QT-2 — Cài đặt site: công tắc + chiến dịch mời + dải thông báo. Chủ sở hữu sửa, vai trò khác chỉ xem.
// Đọc thẳng bảng cau_hinh bằng phiên quản trị (RLS: chỉ người có vai trò aal2) để thấy ai sửa lúc nào.
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri } from "@/lib/quan-tri";
import { CAI_DAT, giaTriHieuLuc } from "@/lib/cau-hinh";
import { thieuCho, tinhTrangMigration } from "@/lib/migration-qt";
import { CaiDat, type DongCaiDat } from "./CaiDat";

export const metadata: Metadata = { title: "Cài đặt site" };

export default async function Page() {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  const [{ data, error }, tt] = await Promise.all([p.sb.from("cau_hinh").select("khoa, gia_tri, cap_nhat_luc"), tinhTrangMigration()]);
  const luu: Record<string, unknown> = {}, luc: Record<string, string> = {};
  for (const d of data ?? []) { luu[d.khoa] = d.gia_tri; luc[d.khoa] = d.cap_nhat_luc; }
  const dong: DongCaiDat[] = CAI_DAT.map((c) => ({
    c, daLuu: c.khoa in luu, hieuLuc: giaTriHieuLuc(c, luu), luc: luc[c.khoa] ?? null, thieu: thieuCho(c.khoa, tt),
  }));
  const thieu = [...new Set(dong.flatMap((d) => d.thieu))].sort();
  return (
    <div className="space-y-6" data-testid="qt-cai-dat">
      <div>
        <h1 className="text-2xl">Cài đặt site</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Có hiệu lực trong khoảng 1 phút, không cần triển khai lại. Mỗi lần lưu ghi nhật ký (giá trị cũ → mới).
          Khoá bí mật vẫn chỉ đặt ở Vercel/Render.
        </p>
      </div>
      {thieu.length > 0 && (
        <Card data-testid="qt-thieu-migration">
          <p role="alert" className="text-sm">
            Supabase chưa chạy migration <b>{thieu.join(", ")}</b> → các công tắc ghi “Cần migration” bên dưới chưa bật được.
            Chạy theo thứ tự số trong Supabase → SQL Editor (hướng dẫn: docs/VIEC-CUA-ANH.md), rồi tải lại trang này.
          </p>
        </Card>
      )}
      {error && <Card><p role="alert" className="text-sm text-cinnabar">Chưa đọc được bảng cài đặt (đã chạy migration 0010 chưa?).</p></Card>}
      <CaiDat dong={dong} duocSua={p.vaiTro === "chu_so_huu"} />
    </div>
  );
}
