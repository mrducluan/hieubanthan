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
import { DungKhoVec, DuyetVec } from "./HocTuvi";
import { TEN_LOAI_KIEM_CHUNG, tinhKiemChung, type DongKiemChung } from "@/lib/kiem-chung";

export const metadata: Metadata = { title: "Học từ góp ý" };

const TT: [string, string][] = [["cho_duyet", "Chờ duyệt"], ["theo_doi", "Đang theo dõi"], ["da_sua", "Đã sửa"], ["bo_qua", "Bỏ qua"]];
const PHAI: Record<string, string> = { pitago: "Pitago", chaldea: "Chaldea", kabbalah: "Qabalah (đã bỏ)", tong_hop: "Tổng hợp" };

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

// LG-ĐS (migration 0017): thống kê kiểm chứng Tử vi + kho vectơ ý định.
const TT_VEC: [string, string][] = [["cho_duyet", "Chờ duyệt"], ["hoat_dong", "Hoạt động"], ["tat", "Đã tắt"]];
const TEN_Y_DINH: Record<string, string> = {
  di_hay_o: "Đi hay ở", tai_van: "Tài vận", hoc_hanh_con: "Học hành của con", phan_van: "Phân vân lựa chọn",
  ba_thang_toi: "3 tháng tới", chon_thoi_diem: "Chọn thời điểm", tong_quan_nam: "Tổng quan năm", hieu_ban_than: "Hiểu bản thân",
};
interface CauVec { id: number; y_dinh: string; cau: string; nguon: string; so_xac_nhan: number; trang_thai: string; cap_nhat: string }
interface HocTuvi {
  kiem_chung: DongKiemChung[];
  phieu: { tong: number; trong_30_ngay: number; nguoi: number };
  luan_giai_luu: { bai: number; nguoi: number };
  tu_luu: number;
  vec_theo_trang_thai: Record<string, number>;
  vec: CauVec[];
}

export default async function Page({ searchParams }: { searchParams: Promise<{ tt?: string; vec?: string }> }) {
  const p = await congQuanTri();
  if (p.trang !== "ok") return <BaoCong trang={p.trang} email={"email" in p ? p.email : null} />;
  const sp = await searchParams;
  const tt = TT.some(([k]) => k === sp.tt) ? sp.tt! : "cho_duyet";
  const ttVec = TT_VEC.some(([k]) => k === sp.vec) ? sp.vec! : "cho_duyet";
  const [{ data, error }, tv] = await Promise.all([
    p.sb.rpc("qt_cum_bat_thuong", { p_trang_thai: tt }),
    p.sb.rpc("thong_ke_hoc_tuvi", { p_trang_thai: ttVec }),
  ]);
  const khungTuvi = <KhungTuvi d={tv.error ? null : (tv.data as HocTuvi)} ttVec={ttVec} tt={tt} />;
  if (error) {
    return (
      <div className="space-y-6">
        <Card><p role="alert" className="text-sm text-cinnabar">Chưa đọc được góp ý (chạy migration 0016 trên Supabase; vai trò chủ sở hữu, biên tập hoặc thẩm định).</p></Card>
        {khungTuvi}
      </div>
    );
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
      {khungTuvi}
    </div>
  );
}

function KhungTuvi({ d, ttVec, tt }: { d: HocTuvi | null; ttVec: string; tt: string }) {
  if (!d) {
    return (
      <Card data-testid="qt-hoc-tuvi">
        <h2 className="text-xl">Tử vi — kiểm chứng &amp; kho ý định</h2>
        <p role="alert" className="mt-2 text-sm text-cinnabar">Chưa đọc được (bật extension vector + chạy migration 0017 trên Supabase).</p>
      </Card>
    );
  }
  const kc = tinhKiemChung(d.kiem_chung);
  return (
    <section className="space-y-4" data-testid="qt-hoc-tuvi">
      <div>
        <h2 className="text-xl">Tử vi — kiểm chứng &amp; kho ý định</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Phiếu "Đúng với mình / Chưa đúng" theo mã thẻ (một phiếu mỗi người mỗi mã, chỉ mã — không chữ, không lá số).
          Mã đủ 30 phiếu mới có tỉ lệ; tỉ lệ đúng thấp xếp lên đầu để xem lại KB (sửa qua Kho tri thức, máy không tự sửa).
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Card><p className="text-xs text-fg-muted">Phiếu còn hạn</p><p className="text-2xl">{d.phieu.tong}</p></Card>
        <Card><p className="text-xs text-fg-muted">Phiếu 30 ngày · người bấm</p><p className="text-2xl">{d.phieu.trong_30_ngay} · {d.phieu.nguoi}</p></Card>
        <Card><p className="text-xs text-fg-muted">Bài luận đã lưu · người</p><p className="text-2xl">{d.luan_giai_luu.bai} · {d.luan_giai_luu.nguoi}</p></Card>
        <Card><p className="text-xs text-fg-muted">Bật tự lưu</p><p className="text-2xl">{d.tu_luu}</p></Card>
      </div>
      {kc.du.length === 0 ? (
        <p className="text-sm text-fg-muted">Chưa mã nào đủ 30 phiếu ({kc.chuaDu} mã đang gom phiếu).</p>
      ) : (
        <Card>
          <table className="w-full text-sm" data-testid="qt-kiem-chung-tuvi">
            <thead><tr className="text-left text-xs text-fg-muted"><th className="py-1">Mã</th><th>Nghĩa</th><th className="text-right">Đúng</th><th className="text-right">Phiếu</th></tr></thead>
            <tbody>
              {kc.du.slice(0, 100).map((r) => (
                <tr key={`${r.loai}|${r.mau}`} className="border-t border-line">
                  <td className="py-1 font-mono text-xs">{r.mau}</td>
                  <td>{r.nhan}<span className="block text-xs text-fg-faint">{TEN_LOAI_KIEM_CHUNG[r.loai] ?? r.loai}</span></td>
                  <td className={`text-right ${r.ti_le_dung < 0.4 ? "text-cinnabar" : ""}`}>{Math.round(r.ti_le_dung * 100)}%</td>
                  <td className="text-right">{r.tong}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {kc.chuaDu > 0 && <p className="mt-2 text-xs text-fg-muted">+ {kc.chuaDu} mã chưa đủ 30 phiếu.</p>}
        </Card>
      )}
      <div className="space-y-3">
        <h3 className="text-lg">Kho vectơ ý định câu hỏi</h3>
        <p className="text-sm text-fg-muted">
          Câu hỏi luật từ khoá chưa nhận ra được so với kho (cos ≥ 0,82). Người dùng bấm "Đúng ý tôi hỏi" → câu (đã lọc tên,
          ngày, số) vào hàng chờ; đủ 3 người khác nhau xác nhận thì tự hoạt động. Tắt câu sai ở đây.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(d.vec_theo_trang_thai).map(([k, n]) => <Badge key={k}>{k}: {n}</Badge>)}
        </div>
        <DungKhoVec />
        <nav aria-label="Trạng thái câu vectơ" className="flex flex-wrap gap-2 text-sm">
          {TT_VEC.map(([k, ten]) => (
            <Link key={k} href={`/quan-tri/hoc?tt=${tt}&vec=${k}`} aria-current={k === ttVec ? "page" : undefined}
              className={k === ttVec ? "rounded-full bg-gold/15 px-3 py-1 text-gold" : "rounded-full border border-line px-3 py-1 text-fg-muted"}>{ten}</Link>
          ))}
        </nav>
        {d.vec.length === 0 ? <p className="text-sm text-fg-muted">Không có câu người dùng nào ở trạng thái này.</p> : (
          <div className="grid gap-2">
            {d.vec.map((c) => (
              <Card key={c.id} data-testid="cau-vec">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm">{c.cau}</p>
                  <span className="text-xs text-gold">{TEN_Y_DINH[c.y_dinh] ?? c.y_dinh} · {c.so_xac_nhan} xác nhận · {c.nguon}</span>
                </div>
                <div className="mt-2"><DuyetVec id={c.id} trangThai={c.trang_thai} /></div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
