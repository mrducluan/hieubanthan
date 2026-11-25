"use client";
// TET-2027 — Khu trải nghiệm & chuyển đổi LÌ XÌ TẾT 2027 ngay trên trang trụ /nam/2027.
// Tái sử dụng trực tiếp BaoLiXi3D của PR #362 (giữ nguyên pháo hoa canvas 2027/PHÚC, thiệp chúc hiện từng chữ,
// nút bắn pháo hoa lại & 4 chất liệu giấy Tết). Bấm CTA truyền ?mau=&hoa= sang /li-xi-tet-2027.
import { useState } from "react";
import Link from "@/components/khung/Lien";
import { Gift, PartyPopper, RotateCcw, Sparkles } from "lucide-react";
import { BaoLiXi3D } from "@/components/li-xi/BaoLiXi3D";
import {
  DANH_SACH_MAU_THIEP,
  dinhDangVnd,
  mauThiepTheoMa,
  type HoaTietTet,
  type MauThiep,
  type ThongTinLiXi,
} from "@/lib/li-xi-tet";

export function KhuLiXiTet2027({ thongTin }: { thongTin?: Pick<ThongTinLiXi, "bat" | "gia_1" | "gia_3" | "gia_5"> }) {
  const [mau, setMau] = useState<MauThiep>("do_son");
  const [hoa, setHoa] = useState<HoaTietTet>("linh_vat");
  const [daMo, setDaMo] = useState(false);
  const [phatLai, setPhatLai] = useState(0);

  const thongTinMau = mauThiepTheoMa(mau);
  const banDuoc = thongTin?.bat === true;
  const gia1 = thongTin?.gia_1 ?? 99000;
  const gia3 = thongTin?.gia_3 ?? 249000;
  const gia5 = thongTin?.gia_5 ?? 399000;

  function chonMau(m: MauThiep) {
    setMau(m);
    setHoa(mauThiepTheoMa(m).hoaMacDinh);
  }

  function xemThuPhaoHoa() {
    if (!daMo) {
      setDaMo(true);
    } else {
      setPhatLai((n) => n + 1);
    }
  }

  return (
    <section
      id="li-xi-tet-2027"
      aria-labelledby="tieu-de-li-xi-2027"
      data-testid="khu-li-xi-tet-2027"
      data-nosnippet=""
      className="relative overflow-x-clip rounded-3xl border border-gold/40 p-5 shadow-card sm:p-6"
      style={{
        background:
          "radial-gradient(80% 80% at 0% 50%, rgba(158, 27, 34, 0.28), transparent 60%), radial-gradient(60% 60% at 100% 0%, rgba(233, 196, 106, 0.14), transparent 55%), rgba(18, 18, 42, 0.82)",
      }}
    >
      <div className="grid items-center gap-6 md:grid-cols-[0.95fr_1.05fr]">
        {/* Cột trái: BaoLiXi3D nguyên bản từ PR #362 (pháo hoa canvas + chữ 2027/PHÚC + thiệp chúc từng chữ) */}
        <div className="flex flex-col items-center">
          <BaoLiXi3D
            mauThiep={mau}
            hoaTiet={hoa}
            nenGam
            hoaRoi
            daMo={daMo}
            onMo={() => setDaMo(true)}
            phatLai={phatLai}
            compact
            nhanNut="Bấm thử để xem hiệu ứng mở bao & pháo hoa"
          />
          <div className="mt-3 flex w-full max-w-sm flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={xemThuPhaoHoa}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-bg shadow-md transition-opacity hover:opacity-95"
            >
              <PartyPopper className="size-3.5" aria-hidden />
              {daMo ? "Xem lại pháo hoa & lời chúc" : "Xem thử pháo hoa & lời chúc"}
            </button>
            {daMo && (
              <button
                type="button"
                onClick={() => setDaMo(false)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-bg/60 px-3 py-2 text-xs text-fg-muted transition-colors hover:border-gold/50 hover:text-fg"
              >
                <RotateCcw className="size-3" aria-hidden />
                Đóng bao
              </button>
            )}
          </div>
        </div>

        {/* Cột phải: Giá trị & chọn nhanh 4 chất liệu giấy Tết */}
        <div className="space-y-4">
          <div>
            <p className="eyebrow text-gold">Quà tặng đầu xuân · Lì Xì Tết Đinh Mùi 2027</p>
            <h2 id="tieu-de-li-xi-2027" className="mt-1 font-serif text-2xl font-medium leading-snug text-[#fff7e6]">
              Tặng Lì Xì Tri Thức — Mở trọn 12 tháng Đinh Mùi 2027
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
              Chọn nhanh chất liệu giấy Tết tại đây. Người nhận tự mở bao và nhập ngày sinh của chính họ (bảo vệ riêng tư, người tặng không thấy) để đọc trọn báo cáo Tử vi · Bát tự · Thần số 2027.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-fg-faint">Chọn thử chất liệu giấy Tết</p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Chọn chất liệu giấy Tết">
              {DANH_SACH_MAU_THIEP.map((m) => {
                const dangChon = m.ma === mau;
                return (
                  <button
                    key={m.ma}
                    type="button"
                    onClick={() => chonMau(m.ma)}
                    aria-pressed={dangChon}
                    className={`rounded-xl border p-2.5 text-left transition-colors ${
                      dangChon
                        ? "border-gold bg-gold/15 text-fg"
                        : "border-line/80 bg-bg/60 text-fg-muted hover:border-gold/45 hover:text-fg"
                    }`}
                  >
                    <span
                      className="mb-1.5 block h-2.5 w-full rounded"
                      style={{ background: `linear-gradient(90deg, ${m.nenChinh}, ${m.nenPhu})`, border: `1px solid ${m.vien}` }}
                      aria-hidden
                    />
                    <span className="block text-xs font-semibold">{m.ten}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {banDuoc ? (
          <div className="flex flex-wrap gap-2 text-xs text-fg-muted">
            <span className="rounded-lg border border-gold/25 bg-bg/60 px-2.5 py-1">
              1 bao: <strong className="tabular-nums text-[#f7cf68]">{dinhDangVnd(gia1)}</strong>
            </span>
            <span className="rounded-lg border border-gold/35 bg-gold/10 px-2.5 py-1">
              Combo 3 bao: <strong className="tabular-nums text-[#f7cf68]">{dinhDangVnd(gia3)}</strong>
            </span>
            <span className="rounded-lg border border-gold/25 bg-bg/60 px-2.5 py-1">
              Combo 5 bao: <strong className="tabular-nums text-[#f7cf68]">{dinhDangVnd(gia5)}</strong>
            </span>
          </div>
          ) : (
            <p className="rounded-lg border border-line/70 bg-bg/60 px-3 py-2 text-xs leading-relaxed text-fg-muted" data-testid="li-xi-chua-mo-ban">
              Lì xì Tết 2027 chưa mở bán — bạn vẫn xem thử bao, pháo hoa và lời chúc ở đây; giá sẽ hiện khi mở bán.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Link
              href={`/li-xi-tet-2027?mau=${mau}&hoa=${hoa}`}
              className="nut-sang inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-bg shadow-lg transition-transform hover:-translate-y-0.5"
              data-testid="nut-chon-li-xi-2027"
            >
              <Gift className="size-4" aria-hidden />
              Thiết kế & Gửi mẫu {thongTinMau.ten} →
            </Link>
            <span className="inline-flex items-center gap-1 text-xs text-fg-faint">
              <Sparkles className="size-3 text-gold" aria-hidden />
              Gửi link qua Zalo / Messenger
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
