"use client";
// TET-2027 — Ô tìm nhanh năm sinh trên trang trụ /nam/2027.
// Chỉ tra cứu trực tiếp trên dữ liệu `bang_con_giap` mà engine đã trả về — tuyệt đối không tự tính can chi hay tam tai ở web.
import { useMemo, useState } from "react";
import Link from "@/components/khung/Lien";
import { Search } from "lucide-react";

export interface DongConGiapTraNhanh {
  chi: string;
  quan_he: string;
  nhan: string;
  tam_tai: number | null;
  nam_sinh: number[];
  nam_sinh_trang?: number[];
}

interface Props {
  nam: number;
  bang: DongConGiapTraNhanh[];
}

const GOI_Y = [1991, 1997, 1990, 1995];

export function TimNhanhNamSinh({ nam, bang }: Props) {
  const [nhap, setNhap] = useState("");

  const chiMuc = useMemo(() => {
    const map = new Map<number, { dong: DongConGiapTraNhanh; coTrang: boolean }>();
    for (const dong of bang) {
      const dsTrang = new Set(dong.nam_sinh_trang ?? []);
      for (const ns of dong.nam_sinh) {
        map.set(ns, { dong, coTrang: dsTrang.has(ns) });
      }
      for (const ns of dsTrang) {
        if (!map.has(ns)) map.set(ns, { dong, coTrang: true });
      }
    }
    return map;
  }, [bang]);

  const namSo = /^\d{4}$/.test(nhap.trim()) ? Number(nhap.trim()) : null;
  const ketQua = namSo !== null ? chiMuc.get(namSo) ?? null : null;

  return (
    <div className="mt-3 rounded-2xl border border-gold/30 bg-surface/50 p-3.5" data-testid="tim-nhanh-nam-sinh">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="tim-nam-sinh-2027" className="sr-only">
          Nhập năm sinh để tra nhanh tuổi năm {nam}
        </label>
        <div className="relative flex-1 sm:max-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-fg-faint" aria-hidden />
          <input
            id="tim-nam-sinh-2027"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={nhap}
            onChange={(e) => setNhap(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Nhập năm sinh (VD: 1991)"
            className="w-full rounded-full border border-line bg-bg/80 py-1.5 pl-8 pr-3 text-sm tabular-nums text-fg placeholder:text-fg-faint focus:border-gold focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {GOI_Y.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setNhap(String(y))}
              className={`rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors ${
                namSo === y
                  ? "border-gold bg-gold/20 font-medium text-gold"
                  : "border-line/80 bg-bg/50 text-fg-muted hover:border-gold/50 hover:text-fg"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {namSo !== null && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-sm">
          {ketQua ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-fg">
                  Sinh năm <strong className="tabular-nums">{namSo}</strong> — tuổi{" "}
                  <strong className="font-serif text-base">{ketQua.dong.chi}</strong>
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    ketQua.dong.quan_he === "tam_hop" || ketQua.dong.quan_he === "luc_hop"
                      ? "border-jade/40 bg-jade/10 text-jade"
                      : ketQua.dong.quan_he === "binh"
                        ? "border-line text-fg-muted"
                        : "border-gold/45 bg-gold/10 text-gold"
                  }`}
                >
                  {ketQua.dong.nhan}
                </span>
                {ketQua.dong.tam_tai && (
                  <span className="rounded-full border border-gold/45 bg-gold/10 px-2 py-0.5 text-xs text-gold">
                    Tam tai năm {ketQua.dong.tam_tai}
                  </span>
                )}
              </div>
              <Link
                href={ketQua.coTrang ? `/nam/${nam}/tuoi-${namSo}` : `/thoi-gian-toi?nam=${nam}`}
                className="text-xs font-semibold text-gold underline underline-offset-2 hover:text-[#fde68a]"
              >
                {ketQua.coTrang ? `Xem tử vi ${nam} tuổi ${namSo} →` : `Xem năm ${nam} của riêng bạn →`}
              </Link>
            </>
          ) : (
            <span className="text-xs text-fg-muted">
              Chưa có năm {namSo} trong bảng tóm tắt — bạn có thể{" "}
              <Link href={`/thoi-gian-toi?nam=${nam}`} className="text-gold underline">
                xem năm {nam} theo ngày sinh riêng
              </Link>
              .
            </span>
          )}
        </div>
      )}
    </div>
  );
}
