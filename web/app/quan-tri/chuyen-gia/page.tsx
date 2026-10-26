// SAO-CG (0029) — /quan-tri/chuyen-gia: hàng đợi "Hỏi chuyên gia" cho chuyên gia (vai trò chủ sở hữu / thẩm định, MFA — DB kiểm
// lại trong từng hàm SQL). Thấy câu hỏi + ảnh chụp hồ sơ (chỉ khi người hỏi đồng ý; mỗi lần đọc ghi nhật ký) + bảng số engine
// tính theo mảng; viết trả lời có kiểm cụm cấm trước khi gửi; chủ sở hữu bấm Hoàn sau khi đã chuyển tiền ngoài hệ thống.
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri, TEN_VAI_TRO } from "@/lib/quan-tri";
import { dinhDangVnd } from "@/lib/chuyen-gia-hoi";
import { HangDoiChuyenGia, type CauQT } from "./HangDoiChuyenGia";

export const metadata: Metadata = { title: "Hỏi chuyên gia" };

const TT: [string, string][] = [["cho_tra_loi", "Chờ trả lời"], ["qua_han", "Quá hạn"], ["da_tra_loi", "Đã trả lời"], ["hoan", "Đã hoàn"], ["tat_ca", "Tất cả"]];

interface ThongKe { ngay: number; dang_cho: number; qua_han: number; da_tra_loi: number; hoan: number; hoi_vien: number; doanh_thu_vnd: number; so_danh_gia: number; danh_gia_tb: number | null; gio_tra_loi_tb: number | null }

export default async function Page({ searchParams }: { searchParams: Promise<{ tt?: string }> }) {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  if (p.vaiTro !== "chu_so_huu" && p.vaiTro !== "tham_dinh") {
    return <Card><p className="text-sm text-fg-muted">Vai trò của bạn: {TEN_VAI_TRO[p.vaiTro]}. Chỉ chủ sở hữu và chuyên gia thẩm định trả lời câu hỏi.</p></Card>;
  }
  const sp = await searchParams;
  const tt = TT.some(([k]) => k === sp.tt) ? sp.tt! : "cho_tra_loi";
  const [ds, tk] = await Promise.all([
    p.sb.rpc("ds_cau_hoi_chuyen_gia", { p_trang_thai: tt === "tat_ca" ? null : tt, p_gioi_han: 100 }),
    p.sb.rpc("thong_ke_chuyen_gia", { p_ngay: 30 }),
  ]);
  if (ds.error) {
    return <Card><p role="alert" className="text-sm text-cinnabar">Chưa đọc được hàng đợi (chạy migration 0029 trên Supabase; vai trò chủ sở hữu hoặc thẩm định, đã MFA).</p></Card>;
  }
  const k = (tk.error ? null : tk.data) as ThongKe | null;
  const hang = (ds.data ?? []) as CauQT[];
  return (
    <div className="space-y-6" data-testid="qt-chuyen-gia">
      <div>
        <h1 className="text-2xl">Hỏi chuyên gia</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Mỗi câu một người thật đã trả tiền, chờ trong hạn. Trả lời bằng lời đời thường, có mặt sáng lẫn mặt tối, thuật ngữ chỉ ở
          "vì sao nói vậy"; không tên bệnh, không phán hung, không vật phẩm, không link / số liên lạc. Ảnh chụp hồ sơ chỉ hiện khi
          người hỏi đồng ý và tự xoá sau 30 ngày; mỗi lần mở đều ghi nhật ký. Giá / hạn ở <Link href="/quan-tri/cai-dat" className="text-gold hover:underline">Cài đặt</Link>.
        </p>
      </div>
      {k && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="qt-cg-thong-ke">
          <Card><p className="text-xs text-fg-muted">Đang chờ</p><p className="text-2xl">{k.dang_cho}</p></Card>
          <Card><p className="text-xs text-fg-muted">Quá hạn</p><p className={`text-2xl ${k.qua_han ? "text-cinnabar" : ""}`}>{k.qua_han}</p></Card>
          <Card><p className="text-xs text-fg-muted">Đã trả lời · {k.ngay} ngày</p><p className="text-2xl">{k.da_tra_loi}</p></Card>
          <Card><p className="text-xs text-fg-muted">Hoàn · {k.ngay} ngày</p><p className="text-2xl">{k.hoan}</p></Card>
          <Card><p className="text-xs text-fg-muted">Doanh thu · {k.ngay} ngày</p><p className="text-2xl">{dinhDangVnd(k.doanh_thu_vnd)}</p></Card>
          <Card><p className="text-xs text-fg-muted">Đánh giá · giờ trả lời TB</p><p className="text-2xl">{k.danh_gia_tb ?? "—"}<span className="text-sm text-fg-muted"> /5 ({k.so_danh_gia}) · {k.gio_tra_loi_tb ?? "—"} h</span></p></Card>
        </div>
      )}
      <nav aria-label="Trạng thái" className="flex flex-wrap gap-2 text-sm">
        {TT.map(([kq, ten]) => (
          <Link key={kq} href={`/quan-tri/chuyen-gia?tt=${kq}`} aria-current={kq === tt ? "page" : undefined}
            className={kq === tt ? "rounded-full bg-gold/15 px-3 py-1 text-gold" : "rounded-full border border-line px-3 py-1 text-fg-muted"}>{ten}</Link>
        ))}
      </nav>
      <HangDoiChuyenGia ds={hang} chuSoHuu={p.vaiTro === "chu_so_huu"} />
    </div>
  );
}
