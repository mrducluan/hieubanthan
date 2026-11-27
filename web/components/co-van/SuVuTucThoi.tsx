"use client";
// Chặng 3.1 — Tầng Chiến thuật Sự vụ tức thời (Kỳ Môn Thời Gia · Lục Hào Nạp Giáp đọc riêng, không gộp điểm CD-1).
import { useState } from "react";
import { ArrowUpRight, Clock, Compass, Dices, ShieldAlert, Sparkles } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { cn } from "@/lib/utils";

type MaTinhHuong =
  | "dam_phan_thuong_vu"
  | "ky_ket_hop_dong"
  | "thu_hoi_cong_no"
  | "ra_mat_khai_truong"
  | "hoa_giai_bat_dong"
  | "cho_tin_ket_qua";

const CAC_TINH_HUONG: { ma: MaTinhHuong; ten: string; goiY: string }[] = [
  { ma: "dam_phan_thuong_vu", ten: "Đàm phán thương vụ", goiY: "Buổi gặp đối tác bàn giá dịch vụ tuần này nên chọn giờ nào và giữ nhịp ra sao?" },
  { ma: "ky_ket_hop_dong", ten: "Ký kết hợp đồng", goiY: "Sắp ký hợp đồng thuê mặt bằng cần rà điểm gì về giấy tờ và chọn khung giờ nào?" },
  { ma: "thu_hoi_cong_no", ten: "Thu hồi công nợ", goiY: "Nhắc đối tác thanh toán khoản công nợ đến hạn lúc nào dễ có phản hồi thực chất?" },
  { ma: "ra_mat_khai_truong", ten: "Ra mắt · Mở hàng", goiY: "Đợt mở bán sản phẩm mới này sức cầu thực tế và khung giờ mở hàng thế nào?" },
  { ma: "hoa_giai_bat_dong", ten: "Hoà giải bất đồng", goiY: "Ngồi lại tháo gỡ hiểu lầm với cộng sự nên chọn khung giờ êm nào?" },
  { ma: "cho_tin_ket_qua", ten: "Chờ hồi âm · Phê duyệt", goiY: "Hồ sơ báo giá đã nộp bao giờ thuận nhịp hỏi thăm kết quả?" },
];

interface TrichCoThu {
  sach: string;
  han: string;
  y_nghia: string;
}

interface KetQuaSuVu {
  an_toan_chan?: { xu_ly: string; loai: string; cau_tra_loi: string };
  chuyen_huong_tuoi?: { tuoi: number; thong_bao: string };
  chuyen_huong?: { ly_do: string; thong_bao: string };
  khung?: { tieu_de: string; phu_de: string; ranh_gioi: string };
  tinh_huong?: { ma: string; ten: string; mo_ta: string };
  goc_ky_mon?: {
    nhan: string;
    ngay: string;
    gio_thuan: { chi: string; khung: string; phuong: string; cua: string; noi_bat?: boolean; loi: string }[];
    ghi_chu_gio?: string | null;
    trich_co_thu: TrichCoThu;
  };
  goc_luc_hao?: {
    nhan: string;
    nguon_gieo: string;
    gia_tri_hao: number[];
    que_ban: { so: number; ten: string; hao_dong: number[] };
    que_bien?: { so: number; ten: string } | null;
    dung_than: string;
    ly_do_dung_than: string;
    muc: "thuan" | "can_bang" | "can_chu_dong";
    nhan_muc: string;
    tom_tat: string;
    can_cu: string[];
    ung_ky: { chi: string; ly_do: string; hao: number; ngay_gan_nhat: string; sau_bao_nhieu_ngay: number }[];
    ung_ky_ghi_chu: string;
    the_que?: string | null;
    trich_co_thu: TrichCoThu;
  };
  chuan_bi_thuc_te?: string[];
  ranh_gioi?: string;
}

function mauMuc(m?: string) {
  if (m === "thuan") return "border-jade/45 bg-jade/10 text-jade";
  if (m === "can_chu_dong") return "border-amber-400/45 bg-amber-500/10 text-amber-300";
  return "border-gold/45 bg-gold/10 text-gold";
}

export function SuVuTucThoi() {
  const hs = useHoSo();
  const [tinhHuong, setTinhHuong] = useState<MaTinhHuong>("dam_phan_thuong_vu");
  const [cauHoi, setCauHoi] = useState(CAC_TINH_HUONG[0]!.goiY);
  const [ngayXem, setNgayXem] = useState("");
  const [nhapTay, setNhapTay] = useState(false);
  const [haoTay, setHaoTay] = useState<number[]>([7, 8, 7, 8, 9, 8]);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaSuVu | null>(null);

  function chonTinhHuong(ma: MaTinhHuong) {
    setTinhHuong(ma);
    const th = CAC_TINH_HUONG.find((x) => x.ma === ma);
    if (th) setCauHoi(th.goiY);
  }

  async function guiXem(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);
    setDangTai(true);
    try {
      const ns = hs ? ngaySinhIso(hs) : null;
      const res = await fetch("/api/co-van/su-vu", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cau_hoi: cauHoi.trim(),
          tinh_huong: tinhHuong,
          ngay_xem: ngayXem || null,
          gia_tri_hao: nhapTay ? haoTay : null,
          ngay_sinh: ns || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(body.error ?? "Chưa tra được sự vụ lúc này, bạn thử lại sau giây lát.");
        return;
      }
      setKq(body as KetQuaSuVu);
    } catch {
      setLoi("Mất kết nối tạm thời khi tra sự vụ.");
    } finally {
      setDangTai(false);
    }
  }

  return (
    <section className="space-y-6" data-testid="su-vu-tuc-thoi">
      <form onSubmit={guiXem} className="space-y-5 rounded-2xl border border-line/80 bg-surface/40 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">Chiến thuật Sự vụ ngắn hạn · Đọc riêng 2 môn</p>
          <h2 className="mt-1 text-xl font-semibold text-fg">Kỳ Môn Thời Gia &amp; Lục Hào Nạp Giáp</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Chọn đúng loại việc sắp diễn ra: Kỳ Môn lọc khung giờ ban ngày &amp; hướng hành sự; Lục Hào gieo quẻ soi hào đại diện (dụng thần) và ngày can chi ứng kỳ.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn tình huống sự vụ">
          {CAC_TINH_HUONG.map((th) => (
            <button
              key={th.ma}
              type="button"
              data-testid={`su-vu-chip-${th.ma}`}
              onClick={() => chonTinhHuong(th.ma)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                tinhHuong === th.ma ? "border-gold bg-gold/15 text-gold" : "border-line/80 text-fg-muted hover:text-fg",
              )}
            >
              {th.ten}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="su-vu-cau-hoi" className="block text-xs font-medium text-fg-muted">
            Việc cụ thể bạn đang chuẩn bị (3–500 ký tự)
          </label>
          <textarea
            id="su-vu-cau-hoi"
            data-testid="su-vu-cau-hoi"
            rows={2}
            value={cauHoi}
            onChange={(e) => setCauHoi(e.target.value)}
            className="w-full rounded-xl border border-line bg-bg/70 px-3.5 py-2.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="su-vu-ngay" className="block text-xs font-medium text-fg-muted">
              Ngày dự định hành sự (để trống = hôm nay)
            </label>
            <input
              id="su-vu-ngay"
              type="date"
              value={ngayXem}
              onChange={(e) => setNgayXem(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
              <input
                type="checkbox"
                checked={nhapTay}
                onChange={(e) => setNhapTay(e.target.checked)}
                className="rounded border-line accent-gold"
              />
              Tôi đã gieo 3 đồng xu ở ngoài và muốn tự nhập 6 hào
            </label>
          </div>
        </div>

        {nhapTay && (
          <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-line/60 bg-bg/50 p-3.5 sm:grid-cols-6">
            {haoTay.map((val, idx) => (
              <div key={idx}>
                <label className="block text-[11px] text-fg-faint">Hào {idx + 1}</label>
                <select
                  value={val}
                  onChange={(e) => {
                    const next = [...haoTay];
                    next[idx] = Number(e.target.value);
                    setHaoTay(next);
                  }}
                  className="mt-1 h-9 w-full rounded-lg border border-line bg-bg px-2 text-xs text-fg"
                >
                  <option value={7}>7 · Thiếu dương (—)</option>
                  <option value={8}>8 · Thiếu âm (- -)</option>
                  <option value={9}>9 · Lão dương (○ động)</option>
                  <option value={6}>6 · Lão âm (× động)</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {loi && <p role="alert" className="text-sm text-amber-300">{loi}</p>}

        <button
          type="submit"
          disabled={dangTai || cauHoi.trim().length < 3}
          data-testid="su-vu-nut-xem"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Dices className="size-4" aria-hidden />
          {dangTai ? "Đang lập bàn Kỳ Môn & khởi quẻ Lục Hào…" : "Khởi quẻ & Soi khung giờ hành sự"}
        </button>
      </form>

      {kq?.an_toan_chan && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 text-sm text-fg" data-testid="su-vu-an-toan">
          <p className="flex items-center gap-2 font-semibold text-amber-300">
            <ShieldAlert className="size-4" aria-hidden /> Lưu ý an toàn ưu tiên trước
          </p>
          <p className="mt-2 leading-relaxed">{kq.an_toan_chan.cau_tra_loi}</p>
        </div>
      )}

      {kq?.chuyen_huong_tuoi && (
        <div className="rounded-2xl border border-line bg-surface/40 p-5 text-sm text-fg-muted">
          {kq.chuyen_huong_tuoi.thong_bao}
        </div>
      )}

      {kq?.chuyen_huong && (
        <div className="rounded-2xl border border-line bg-surface/40 p-5 text-sm text-fg-muted">
          {kq.chuyen_huong.thong_bao}
        </div>
      )}

      {kq?.goc_ky_mon && kq?.goc_luc_hao && (
        <div className="space-y-5" data-testid="su-vu-ket-qua">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* GÓC NHÌN 1: KỲ MÔN THỜI GIA */}
            <div className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="su-vu-goc-ky-mon">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gold">{kq.goc_ky_mon.nhan}</p>
                  <p className="mt-0.5 text-xs text-fg-faint">Ngày xem: {kq.goc_ky_mon.ngay}</p>
                </div>
                <Clock className="size-4 shrink-0 text-gold" aria-hidden />
              </div>

              {kq.goc_ky_mon.gio_thuan.length > 0 ? (
                <ul className="space-y-2.5">
                  {kq.goc_ky_mon.gio_thuan.map((g) => (
                    <li key={`${g.chi}-${g.khung}`} className="rounded-xl border border-line/70 bg-bg/50 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-fg">Giờ {g.chi} ({g.khung})</span>
                        <span className="rounded-full border border-jade/40 bg-jade/10 px-2.5 py-0.5 text-xs text-jade">
                          Hướng {g.phuong} · Cửa {g.cua}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-fg-muted">{g.loi}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-line/60 bg-bg/50 p-3 text-xs text-fg-muted">
                  {kq.goc_ky_mon.ghi_chu_gio}
                </p>
              )}

              <div className="rounded-xl border border-line/60 bg-bg/40 p-3 text-xs text-fg-muted">
                <p className="font-medium text-fg">{kq.goc_ky_mon.trich_co_thu.sach}</p>
                <p className="mt-1 font-serif text-gold/90">「{kq.goc_ky_mon.trich_co_thu.han}」</p>
                <p className="mt-1 leading-relaxed">{kq.goc_ky_mon.trich_co_thu.y_nghia}</p>
              </div>

              <Link href="/ky-mon" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
                Mở bàn Kỳ Môn 9 cung chi tiết <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>

            {/* GÓC NHÌN 2: LỤC HÀO NẠP GIÁP */}
            <div className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="su-vu-goc-luc-hao">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gold">{kq.goc_luc_hao.nhan}</p>
                  <p className="mt-0.5 text-xs text-fg-faint">{kq.goc_luc_hao.nguon_gieo}</p>
                </div>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", mauMuc(kq.goc_luc_hao.muc))}>
                  {kq.goc_luc_hao.nhan_muc}
                </span>
              </div>

              <div className="rounded-xl border border-line/70 bg-bg/50 p-3.5 text-sm">
                <p className="font-semibold text-fg">
                  Quẻ {kq.goc_luc_hao.que_ban.ten}
                  {kq.goc_luc_hao.que_bien ? ` → biến ${kq.goc_luc_hao.que_bien.ten}` : " (quẻ tĩnh)"}
                </p>
                <p className="mt-1 text-xs text-gold">
                  Dụng thần trọng tâm: <b>{kq.goc_luc_hao.dung_than}</b>
                </p>
                <p className="mt-1 text-xs text-fg-muted">{kq.goc_luc_hao.ly_do_dung_than}</p>
              </div>

              <ul className="space-y-1.5 text-xs text-fg-muted">
                {kq.goc_luc_hao.can_cu.map((c, idx) => (
                  <li key={idx} className="leading-relaxed">• {c}</li>
                ))}
              </ul>

              {kq.goc_luc_hao.ung_ky.length > 0 && (
                <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs">
                  <p className="font-semibold text-gold">Nhịp ứng kỳ gợi ý trên quẻ</p>
                  <ul className="mt-1 space-y-1 text-fg">
                    {kq.goc_luc_hao.ung_ky.map((u, idx) => (
                      <li key={idx}>
                        • Ngày {u.chi} gần nhất ({u.ngay_gan_nhat}, khoảng {u.sau_bao_nhieu_ngay} ngày tới) — hào {u.hao}: {u.ly_do}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-fg-faint">{kq.goc_luc_hao.ung_ky_ghi_chu}</p>
                </div>
              )}

              <div className="rounded-xl border border-line/60 bg-bg/40 p-3 text-xs text-fg-muted">
                <p className="font-medium text-fg">{kq.goc_luc_hao.trich_co_thu.sach}</p>
                <p className="mt-1 font-serif text-gold/90">「{kq.goc_luc_hao.trich_co_thu.han}」</p>
                <p className="mt-1 leading-relaxed">{kq.goc_luc_hao.trich_co_thu.y_nghia}</p>
              </div>

              <Link href="/kinh-dich" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
                Mở trang Kinh Dịch 6 hào đầy đủ <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          {kq.chuan_bi_thuc_te && kq.chuan_bi_thuc_te.length > 0 && (
            <div className="rounded-2xl border border-jade/35 bg-jade/5 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-jade">
                <Sparkles className="size-4" aria-hidden /> Việc chuẩn bị thực tế trước giờ hành sự
              </p>
              <ul className="mt-2.5 space-y-1.5 text-sm text-fg-muted">
                {kq.chuan_bi_thuc_te.map((v, idx) => (
                  <li key={idx}>• {v}</li>
                ))}
              </ul>
              {kq.khung?.ranh_gioi && (
                <p className="mt-3 border-t border-line/50 pt-2.5 text-xs text-fg-faint">
                  <Compass className="mr-1 inline size-3.5 text-gold" aria-hidden />
                  {kq.khung.ranh_gioi}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
