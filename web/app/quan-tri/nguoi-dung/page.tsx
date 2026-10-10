// QT-2 — Người dùng & Sao: cấp vai trò quản trị (chủ sở hữu) · tra cứu ví Sao theo email (chủ sở hữu + hỗ trợ) ·
// bút toán điều chỉnh Sao có lý do (chủ sở hữu). Không xem hồ sơ / ngày giờ sinh của ai — chỉ số dư và giao dịch Sao.
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri, TEN_VAI_TRO } from "@/lib/quan-tri";
import { SoSao, VaiTroQT, type NguoiQT } from "./NguoiDung";

export const metadata: Metadata = { title: "Người dùng & Sao" };

export default async function Page() {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  const chu = p.vaiTro === "chu_so_huu";
  let ds: NguoiQT[] | null = null, loiDs = false;
  if (chu) {
    const { data, error } = await p.sb.rpc("danh_sach_quan_tri");
    if (error) loiDs = true; else ds = data as NguoiQT[];
  }
  return (
    <div className="space-y-6" data-testid="qt-nguoi-dung">
      <h1 className="text-2xl">Người dùng & Sao</h1>
      {chu ? (
        <Card>
          <h2 className="text-lg">Vai trò quản trị</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Người được cấp phải đăng nhập hieuban.com một lần trước, rồi tự bật mã xác thực (MFA) khi vào /quan-tri.
          </p>
          {loiDs ? <p role="alert" className="mt-3 text-sm text-cinnabar">Chưa chạy migration 0011 trên Supabase.</p>
            : <VaiTroQT ds={ds ?? []} toi={p.user.id} />}
        </Card>
      ) : (
        <Card><p className="text-sm text-fg-muted">Vai trò của bạn: {TEN_VAI_TRO[p.vaiTro]}. Chỉ chủ sở hữu cấp vai trò.</p></Card>
      )}
      {(chu || p.vaiTro === "ho_tro") && (
        <Card>
          <h2 className="text-lg">Sổ Sao</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Tra theo email khi người dùng nhờ hỗ trợ. Mỗi lần tra đều ghi nhật ký. Điều chỉnh = thêm một dòng có lý do
            (không sửa số dư, không xoá dòng cũ).
          </p>
          <SoSao duocDieuChinh={chu} />
        </Card>
      )}
    </div>
  );
}
