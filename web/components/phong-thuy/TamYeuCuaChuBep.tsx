"use client";
// Dương Trạch Tam Yếu — Công cụ tra nhanh Cửa – Chủ – Bếp (3 chạm, không cần đăng nhập).
// Tái sử dụng lưới 3×3 của `SoDoNha`; web CHỈ vẽ dữ liệu engine trả từ `/api/phongthuy/tam-yeu/*`, không tự tính Du Niên.
import { useEffect, useState } from "react";
import { ArrowDown, BookOpen, Compass, Flame, Home } from "lucide-react";
import { SoDoNha, type PhongTrenSoDo } from "@/components/huyen-hoc/SoDoNha";
import type { Muc } from "@/components/luan-giai/kieu";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

const QUAI_DS = [
  { quai: "Khảm", huong: "Bắc" },
  { quai: "Cấn", huong: "Đông Bắc" },
  { quai: "Chấn", huong: "Đông" },
  { quai: "Tốn", huong: "Đông Nam" },
  { quai: "Ly", huong: "Nam" },
  { quai: "Khôn", huong: "Tây Nam" },
  { quai: "Đoài", huong: "Tây" },
  { quai: "Càn", huong: "Tây Bắc" },
] as const;

const QUAI_TU_HUONG: Record<string, string> = Object.fromEntries(QUAI_DS.map((x) => [x.huong, x.quai]));
const HUONG_TU_QUAI: Record<string, string> = Object.fromEntries(QUAI_DS.map((x) => [x.quai, x.huong]));
const DU_NIEN_CAT = new Set(["Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị"]);

interface SoDoNhaRes {
  ma: string; cua: string; chu: string; huong_cua: string; huong_chu: string;
  du_nien: string; cung_nhom: boolean; quan_he_ngu_hanh: string;
  bep_hop: string[]; bep_nen_tranh: string[]; tom_y?: string;
}
interface SoDoBepRes {
  ma: string; bep: string; cua: string; huong_bep: string; huong_cua: string;
  du_nien: string; hanh_bep: string; hanh_cua: string; quan_he_ngu_hanh: string; tom_y?: string;
}
interface TamYeuRes {
  cua: string;
  nguon_hien_thi: string;
  so_do_nha?: SoDoNhaRes;
  so_do_bep?: SoDoBepRes;
}
interface DoHinhItem {
  ma: string; ten: string; ten_han: string; nhom: string; mo_ta: string;
}

function mucTuDuNien(dn?: string | null): Muc | null {
  if (!dn) return null;
  return DU_NIEN_CAT.has(dn) ? "thuan" : "can_chu_dong";
}

export function TamYeuCuaChuBep({ huongCuaGoiY }: { huongCuaGoiY?: string | null }) {
  const [cua, setCua] = useState<string>("Càn");
  const [chu, setChu] = useState<string>("Đoài");
  const [bep, setBep] = useState<string>("Khôn");
  const [kq, setKq] = useState<TamYeuRes | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [doHinh, setDoHinh] = useState<DoHinhItem[] | null>(null);
  const [moDoHinh, setMoDoHinh] = useState(false);

  // Nếu người dùng vừa đo hướng nhà xong ở La Bàn → tự đồng bộ quái Cửa chính.
  useEffect(() => {
    if (huongCuaGoiY && QUAI_TU_HUONG[huongCuaGoiY]) {
      setCua(QUAI_TU_HUONG[huongCuaGoiY]!);
    }
  }, [huongCuaGoiY]);

  useEffect(() => {
    let huy = false;
    setDangTai(true);
    setLoi(null);
    const q = new URLSearchParams({ cua, chu, bep });
    fetch(`/api/phongthuy/tam-yeu/so-do?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .then((d: TamYeuRes) => {
        if (!huy) setKq(d);
      })
      .catch(() => {
        if (!huy) setLoi("Chưa tra được sơ đồ Tam Yếu lúc này. Thử chọn lại sau ít giây.");
      })
      .finally(() => {
        if (!huy) setDangTai(false);
      });
    return () => { huy = true; };
  }, [cua, chu, bep]);

  const chonMuc = (loai: "cua" | "chu" | "bep", val: string) => {
    if (loai === "cua") setCua(val);
    else if (loai === "chu") setChu(val);
    else setBep(val);
    ghi("chart_interacted", {
      mo_dun: "phongthuy",
      kind: "tam_yeu_so_do",
      cua: loai === "cua" ? val : cua,
      chu: loai === "chu" ? val : chu,
      bep: loai === "bep" ? val : bep,
    });
  };

  const taiDoHinh = () => {
    const next = !moDoHinh;
    setMoDoHinh(next);
    if (next && !doHinh) {
      fetch("/api/phongthuy/tam-yeu/do-hinh")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.do_hinh) setDoHinh(d.do_hinh as DoHinhItem[]); })
        .catch(() => null);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "tam_yeu_do_hinh_mo" });
    }
  };

  const nha = kq?.so_do_nha;
  const sdBep = kq?.so_do_bep;
  const phong: PhongTrenSoDo[] = [
    { cung: HUONG_TU_QUAI[cua]!, ten: `Cửa (${cua})`, muc: "can_bang" },
    { cung: HUONG_TU_QUAI[chu]!, ten: `Phòng chủ (${chu})`, muc: mucTuDuNien(nha?.du_nien) },
    { cung: HUONG_TU_QUAI[bep]!, ten: `Bếp (${bep})`, muc: mucTuDuNien(sdBep?.du_nien) },
  ];
  const duNienMap: Record<string, string | null> = {};
  if (nha) duNienMap[nha.huong_chu] = nha.du_nien;
  if (sdBep) duNienMap[sdBep.huong_bep] = sdBep.du_nien;

  return (
    <section
      id="tam-yeu"
      aria-label="Dương Trạch Tam Yếu — Sơ đồ Cửa, Chủ, Bếp"
      data-testid="tam-yeu-cua-chu-bep"
      className="glass rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold">Dương Trạch Tam Yếu · Triệu Cửu Phong</p>
          <h2 className="mt-1 text-xl font-semibold text-fg sm:text-2xl">Tra nhanh thế nhà Cửa – Chủ – Bếp</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Chọn vị trí <b>Cửa chính</b>, <b>Phòng chủ</b> và <b>Bếp nấu</b> theo 8 phương (không cần đăng nhập) để xem ngay sơ đồ Cửu Cung 3×3 và gợi ý đặt bếp.
          </p>
        </div>
        <button
          type="button"
          onClick={taiDoHinh}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-gold hover:text-fg"
        >
          <BookOpen className="size-3.5 text-gold" aria-hidden />
          {moDoHinh ? "Ẩn 10 đồ hình cổ" : "Xem 10 đồ hình lý thuyết"}
        </button>
      </div>

      {/* Bộ chọn 3 chạm: Cửa – Chủ – Bếp */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(
          [
            { key: "cua" as const, label: "1. Cửa chính (Môn)", val: cua, icon: Compass },
            { key: "chu" as const, label: "2. Phòng chủ (Chủ)", val: chu, icon: Home },
            { key: "bep" as const, label: "3. Bếp nấu (Táo)", val: bep, icon: Flame },
          ]
        ).map(({ key, label, val, icon: Icon }) => (
          <div key={key} className="rounded-xl border border-line/70 bg-surface/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-fg">
              <Icon className="size-3.5 text-gold" aria-hidden /> {label}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {QUAI_DS.map((q) => {
                const active = val === q.quai;
                return (
                  <button
                    key={q.quai}
                    type="button"
                    aria-pressed={active}
                    onClick={() => chonMuc(key, q.quai)}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-left text-xs transition-colors",
                      active
                        ? "border-gold bg-gold/15 font-medium text-fg"
                        : "border-line/60 text-fg-muted hover:border-line hover:text-fg"
                    )}
                  >
                    <span>{q.quai}</span>
                    <span className="ml-1 text-[10px] text-fg-faint">({q.huong})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {loi && <p className="mt-4 text-sm text-cinnabar">{loi}</p>}

      {/* Lưới Cửu Cung 3×3 (tái sử dụng SoDoNha) + Giải nghĩa thế Nhà & thế Bếp */}
      <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,22rem)_1fr]">
        <SoDoNha
          phong={phong}
          huongNha={HUONG_TU_QUAI[cua]}
          duNien={duNienMap}
          tieuDe={`Sơ đồ Tam Yếu: Cửa ${cua}, Chủ ${chu}, Bếp ${bep}`}
          className="mx-auto"
        />

        <div className="space-y-3" aria-live="polite">
          {dangTai && !kq && <p className="text-sm text-fg-muted">Đang tra sơ đồ từ máy tính toán…</p>}

          {nha && (
            <div className={cn("rounded-xl border p-4", nha.cung_nhom ? "border-jade/40 bg-jade/5" : "border-cinnabar/35 bg-cinnabar/5")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-fg">
                  Thế nhà: Cửa {nha.cua} ({nha.huong_cua}) → Chủ {nha.chu} ({nha.huong_chu})
                </p>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", nha.cung_nhom ? "bg-jade/15 text-jade" : "bg-cinnabar/15 text-cinnabar")}>
                  {nha.du_nien}
                </span>
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                {nha.cung_nhom ? "Cùng nhóm Đông/Tây Tứ Trạch" : "Khác nhóm Đông/Tây Tứ Trạch"} · Ngũ hành: {nha.quan_he_ngu_hanh}
              </p>
              {nha.tom_y && <p className="mt-2 text-sm leading-relaxed text-fg">{nha.tom_y}</p>}
              {nha.bep_hop.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-fg-muted">Bếp hợp thế nhà này:</span>
                  {nha.bep_hop.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => chonMuc("bep", q)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 transition-colors",
                        bep === q ? "border-jade bg-jade/20 font-medium text-jade" : "border-jade/40 text-jade hover:bg-jade/10"
                      )}
                    >
                      {q} ({HUONG_TU_QUAI[q]})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {sdBep && (
            <div className={cn("rounded-xl border p-4", DU_NIEN_CAT.has(sdBep.du_nien) ? "border-jade/35 bg-jade/5" : "border-line bg-surface/40")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-fg">
                  Thế bếp: Bếp {sdBep.bep} ({sdBep.huong_bep}) phối Cửa {sdBep.cua}
                </p>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", DU_NIEN_CAT.has(sdBep.du_nien) ? "bg-jade/15 text-jade" : "bg-cinnabar/15 text-cinnabar")}>
                  {sdBep.du_nien}
                </span>
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                Bếp hành {sdBep.hanh_bep} · Cửa hành {sdBep.hanh_cua} · {sdBep.quan_he_ngu_hanh}
              </p>
              {sdBep.tom_y && <p className="mt-2 text-sm leading-relaxed text-fg">{sdBep.tom_y}</p>}
            </div>
          )}

          {/* CTA dẫn phễu sang báo cáo đầy đủ Nhà của bạn */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs">
            <span className="text-fg-muted">
              Muốn ghép thêm <b>tuổi cả gia đình</b>, <b>năm xây (Huyền Không)</b> và <b>3 tháng tới</b>?
            </span>
            <a
              href="#nha-cua-ban"
              onClick={() => ghi("chart_interacted", { mo_dun: "phongthuy", kind: "tam_yeu_cta_nha_cua_ban" })}
              className="inline-flex items-center gap-1 font-medium text-gold hover:underline"
            >
              Xem báo cáo Nhà của bạn <ArrowDown className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      </div>

      {/* Ngăn 10 đồ hình lý thuyết cổ (tải theo nhu cầu, sạch BM-1) */}
      {moDoHinh && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-fg-muted">
            10 đồ hình lý thuyết nền tảng · {kq?.nguon_hien_thi ?? "Dương Trạch Tam Yếu (Triệu Cửu Phong)"}
          </p>
          {!doHinh ? (
            <p className="text-xs text-fg-muted">Đang tải danh mục đồ hình…</p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {doHinh.map((item) => (
                <div key={item.ma} className="rounded-xl border border-line/70 bg-surface/40 p-3">
                  <p className="text-sm font-medium text-fg">{item.ten}</p>
                  <p className="mt-0.5 text-[11px] text-gold" lang="zh-Hant">{item.ten_han}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{item.mo_ta}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
