// TS-V3 tầng HỌC — "Học từ góp ý": góp ý đúng/chưa đúng của người dùng (ẩn danh, chỉ chữ ký số) gom thành cụm.
// Cụm đủ 5 lần "chưa đúng" chuyển "chờ duyệt"; người duyệt đọc mẫu ghi chú, sửa KB ở Kho tri thức (PR) rồi đánh dấu
// "đã sửa". Hệ thống KHÔNG tự bật luật. Đọc qua qt_cum_bat_thuong (migration 0016).
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BaoCong } from "@/components/quan-tri/BaoCong";
import { congQuanTri } from "@/lib/quan-tri";
import { CumGopY } from "./CumGopY";

export const metadata: Metadata = { title: "Học từ góp ý" };

const TT: [string, string][] = [["cho_duyet", "Chờ duyệt"], ["theo_doi", "Đang theo dõi"], ["da_sua", "Đã sửa"], ["bo_qua", "Bỏ qua"]];
const PHAI: Record<string, string> = { pitago: "Pitago", chaldea: "Chaldea", kabbalah: "Qabalah", tong_hop: "Tổng hợp" };

interface Cum {
  id: number; chu_ky_mau: string; phai: string; linh_vuc: string | null; ma_cau: string | null; so_lan: number;
  mau_ghi_chu: string[]; trang_thai: string; luat_de_xuat: string | null; cap_nhat: string;
}
interface DuLieu {
  tong_30_ngay: { gop_y: number; dung: number; co_ghi_chu: number };
  theo_phai: Record<string, { gop_y: number; dung: number }>;
  cum: Cum[];
}
const tyLe = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function Page({ searchParams }: { searchParams: Promise<{ tt?: string }> }) {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  const sp = await searchParams;
  const tt = TT.some(([k]) => k === sp.tt) ? sp.tt! : "cho_duyet";
  const { data, error } = await p.sb.rpc("qt_cum_bat_thuong", { p_trang_thai: tt });
  if (error) {
    return <Card><p role="alert" className="text-sm text-cinnabar">Chưa đọc được góp ý (chạy migration 0016 trên Supabase; vai trò chủ sở hữu, biên tập hoặc thẩm định).</p></Card>;
  }
  const d = data as DuLieu;
  return (
    <div className="space-y-6" data-testid="qt-hoc">
      <div>
        <h1 className="text-2xl">Học từ góp ý</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Góp ý "đúng / chưa đúng" dưới mỗi câu trả lời thần số — chỉ lưu các con số đã tính, không tên, không ngày sinh.
          Cụm đủ 5 lần "chưa đúng" sẽ chờ duyệt. Sửa nội dung ở
          <Link href="/quan-tri/tri-thuc" className="mx-1 text-gold hover:underline">Kho tri thức</Link>rồi đánh dấu "Đã sửa".
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs text-fg-muted">Góp ý 30 ngày</p><p className="text-2xl">{d.tong_30_ngay.gop_y}</p></Card>
        <Card><p className="text-xs text-fg-muted">Tỉ lệ "đúng"</p><p className="text-2xl">{tyLe(d.tong_30_ngay.dung, d.tong_30_ngay.gop_y)}</p></Card>
        <Card><p className="text-xs text-fg-muted">Có ghi chú (đã đồng ý)</p><p className="text-2xl">{d.tong_30_ngay.co_ghi_chu}</p></Card>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {Object.entries(d.theo_phai).map(([ph, v]) => (
          <Badge key={ph}>{PHAI[ph] ?? ph}: {v.gop_y} góp ý · {tyLe(v.dung, v.gop_y)} đúng</Badge>
        ))}
      </div>
      <nav aria-label="Trạng thái cụm" className="flex flex-wrap gap-2 text-sm">
        {TT.map(([k, ten]) => (
          <Link key={k} href={`/quan-tri/hoc?tt=${k}`} aria-current={k === tt ? "page" : undefined}
            className={k === tt ? "rounded-full bg-gold/15 px-3 py-1 text-gold" : "rounded-full border border-line px-3 py-1 text-fg-muted"}>{ten}</Link>
        ))}
      </nav>
      {d.cum.length === 0 ? <p className="text-sm text-fg-muted">Chưa có cụm nào ở trạng thái này.</p> : (
        <div className="grid gap-3">
          {d.cum.map((c) => (
            <Card key={c.id} data-testid="cum-gop-y">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-sm">{c.chu_ky_mau}</p>
                <span className="text-xs text-gold">{c.so_lan} lần "chưa đúng" · {PHAI[c.phai] ?? c.phai}</span>
              </div>
              {c.mau_ghi_chu.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">{c.mau_ghi_chu.map((g, i) => <li key={i}>{g}</li>)}</ul>
              )}
              {c.trang_thai !== "bo_qua" && <CumGopY id={c.id} luat={c.luat_de_xuat} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
