// QT-3 — Hỏi đáp: tìm lỗ hổng tri thức từ nhật ký hỏi đáp ĐÃ ẨN DANH (0004/0005: không user_id, không ngày sinh;
// câu hỏi đã lọc). Mục tiêu: biết người dùng hỏi gì mà kho chưa trả lời tốt → viết thêm → họ quay lại.
// Đọc qua hàm thong_ke_hoi / nhat_ky_hoi_gan_day (migration 0011, mọi vai trò quản trị đã qua MFA).
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri } from "@/lib/quan-tri";

export const metadata: Metadata = { title: "Hỏi đáp" };

const MO_DUN: Record<string, string> = { thanso: "Thần số", tuvi: "Tử vi", kinhdich: "Kinh Dịch", battu: "Bát tự", phongthuy: "Phong thuỷ" };
const KY: [string, string][] = [["7", "7 ngày"], ["30", "30 ngày"], ["90", "90 ngày"]];

interface ThongKeHoi {
  tong: number; khong_huu_ich: number;
  theo_mo_dun: Record<string, { tong: number; khong_phu: number }>;
  can_them: { muc: string; so: number }[];
  loai_khong_phu: { mo_dun: string; loai: string; so: number }[];
}
interface CauHoi {
  id: string; luc: string; mo_dun: string; cau_hoi: string; loai: string; xu_ly: string; do_phu: string;
  can_them: string[]; loi_kiem_tra: string[]; cau_tra_loi: string | null; huu_ich: boolean | null;
}

const ngayGio = (s: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(s));
const tyLe = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function Page({ searchParams }: { searchParams: Promise<{ ky?: string; mo_dun?: string }> }) {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  const sp = await searchParams;
  const ky = KY.some(([k]) => k === sp.ky) ? sp.ky! : "30";
  const moDun = sp.mo_dun && sp.mo_dun in MO_DUN ? sp.mo_dun : null;

  const [tk, ds] = await Promise.all([
    p.sb.rpc("thong_ke_hoi", { p_ngay: Number(ky) }),
    p.sb.rpc("nhat_ky_hoi_gan_day", { p_mo_dun: moDun, p_chi_khong_phu: true, p_gioi_han: 60 }),
  ]);
  if (tk.error || ds.error) {
    return <Card><p role="alert" className="text-sm text-cinnabar">Chưa đọc được nhật ký hỏi đáp (chạy migration 0011 trên Supabase; engine cần NHAT_KY_HOI=1 để ghi).</p></Card>;
  }
  const t = tk.data as ThongKeHoi, cau = ds.data as CauHoi[];
  const lk = (o: { ky?: string; mo_dun?: string | null }) => {
    const q = new URLSearchParams();
    const k = o.ky ?? ky, m = "mo_dun" in o ? o.mo_dun : moDun;
    if (k !== "30") q.set("ky", k);
    if (m) q.set("mo_dun", m);
    return `/quan-tri/hoi-dap${q.size ? `?${q}` : ""}`;
  };

  return (
    <div className="space-y-6" data-testid="qt-hoi-dap">
      <div>
        <h1 className="text-2xl">Hỏi đáp — lỗ hổng tri thức</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Câu hỏi đã ẩn danh. "Chưa phủ" = kho chưa có mục khớp, trả lời theo mẫu chung. Viết thêm ở
          <Link href="/quan-tri/tri-thuc" className="mx-1 text-gold hover:underline">Kho tri thức</Link>(trợ lý AI soạn nháp, người duyệt).
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {KY.map(([k, ten]) => (
            <Link key={k} href={lk({ ky: k })} aria-current={k === ky ? "true" : undefined}
              className={k === ky ? "rounded-full bg-gold/15 px-3 py-1 text-gold" : "rounded-full px-3 py-1 text-fg-muted hover:text-fg"}>{ten}</Link>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <h2 className="text-lg">Theo mảng</h2>
          <p className="mt-1 text-sm text-fg-muted">{t.tong.toLocaleString("vi-VN")} câu · {t.khong_huu_ich} lượt 👎</p>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-xs text-fg-muted"><th className="font-normal">Mảng</th><th className="text-right font-normal">Câu</th><th className="text-right font-normal">Chưa phủ</th></tr></thead>
            <tbody>
              {Object.entries(t.theo_mo_dun).sort((a, b) => b[1].tong - a[1].tong).map(([m, v]) => (
                <tr key={m} className="border-t border-line/60">
                  <td className="py-1.5"><Link href={lk({ mo_dun: m === moDun ? null : m })} className={m === moDun ? "text-gold" : "hover:text-gold"}>{MO_DUN[m] ?? m}</Link></td>
                  <td className="text-right">{v.tong}</td>
                  <td className="text-right">{v.khong_phu} <span className="text-xs text-fg-faint">({tyLe(v.khong_phu, v.tong)})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="text-lg">Kho đang thiếu</h2>
          <p className="mt-1 text-xs text-fg-muted">Mục engine báo "cần thêm", nhiều nhất trước.</p>
          <ul className="mt-3 space-y-1 text-sm">
            {t.can_them.slice(0, 15).map((c) => (
              <li key={c.muc} className="flex justify-between gap-3"><span className="font-mono text-xs [overflow-wrap:anywhere]">{c.muc}</span><span>{c.so}</span></li>
            ))}
            {t.can_them.length === 0 && <li className="text-fg-faint">Chưa có.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg">Dạng câu chưa phủ</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {t.loai_khong_phu.slice(0, 15).map((c) => (
              <li key={`${c.mo_dun}:${c.loai}`} className="flex justify-between gap-3">
                <span>{MO_DUN[c.mo_dun] ?? c.mo_dun} · <span className="font-mono text-xs">{c.loai}</span></span><span>{c.so}</span>
              </li>
            ))}
            {t.loai_khong_phu.length === 0 && <li className="text-fg-faint">Chưa có.</li>}
          </ul>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg">Câu hỏi chưa trả lời tốt gần đây{moDun ? ` · ${MO_DUN[moDun]}` : ""}</h2>
        <ul className="mt-3 divide-y divide-line/60">
          {cau.map((c) => (
            <li key={c.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-faint">
                <span>{ngayGio(c.luc)}</span><Badge>{MO_DUN[c.mo_dun] ?? c.mo_dun}</Badge>
                <span className="font-mono">{c.loai}</span>
                {c.do_phu !== "day_du" && <Badge tone="moon">chưa phủ</Badge>}
                {c.huu_ich === false && <Badge tone="cinnabar">👎</Badge>}
                {c.can_them.map((m) => <span key={m} className="font-mono">+{m}</span>)}
              </div>
              <p className="mt-1 text-fg">{c.cau_hoi}</p>
              {c.cau_tra_loi && (
                <details className="mt-1"><summary className="cursor-pointer text-xs text-fg-muted">Câu trả lời đã gửi</summary>
                  <p className="mt-1 whitespace-pre-line text-xs text-fg-muted">{c.cau_tra_loi}</p></details>
              )}
            </li>
          ))}
          {cau.length === 0 && <li className="py-3 text-sm text-fg-faint">Không có câu nào chưa phủ. 🎉</li>}
        </ul>
      </Card>
    </div>
  );
}
