"use client";
// Dương Trạch Tam Yếu — Công cụ tra nhanh Cửa – Chủ – Bếp (3 chạm, không cần đăng nhập).
// Tái sử dụng lưới 3×3 của `SoDoNha`; đồng bộ hai chiều với `HoSoNha` (đọc sẵn nếu đã lưu, 1 chạm áp dụng vào hồ sơ nhà).
// Web CHỈ vẽ dữ liệu engine trả từ `/api/phongthuy/tam-yeu/*`, không tự tính Du Niên.
import { useEffect, useRef, useState } from "react";
import { ArrowDown, BookOpen, Check, ChevronDown, Compass, Flame, Home } from "lucide-react";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { SoDoNha, type PhongTrenSoDo } from "@/components/huyen-hoc/SoDoNha";
import type { Muc } from "@/components/luan-giai/kieu";
import { ghi } from "@/lib/do-luong";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
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

type Quai8 = (typeof QUAI_DS)[number]["quai"];
type Huong8 = (typeof QUAI_DS)[number]["huong"];

const QUAI_TU_HUONG: Record<string, Quai8> = Object.fromEntries(QUAI_DS.map((x) => [x.huong, x.quai])) as Record<string, Quai8>;
const HUONG_TU_QUAI: Record<Quai8, Huong8> = {
  Khảm: "Bắc",
  Cấn: "Đông Bắc",
  Chấn: "Đông",
  Tốn: "Đông Nam",
  Ly: "Nam",
  Khôn: "Tây Nam",
  Đoài: "Tây",
  Càn: "Tây Bắc",
};
const DU_NIEN_CAT = new Set(["Sinh Khí", "Thiên Y", "Diên Niên", "Phục Vị"]);

const EN_DU_NIEN_MEANING: Record<string, { label: string; house: string; stove: string }> = {
  "Sinh Khí": { label: "Very supportive · Vitality", house: "Door-to-master flow supports momentum, clarity, and career/financial growth.", stove: "Stove sector welcomes supportive flow for warmth and household prosperity." },
  "Thiên Y": { label: "Supportive · Health & rest", house: "Gentle, restorative layout favoring restful sleep and steady well-being.", stove: "Great stove placement for nourishment, recovery, and everyday health." },
  "Diên Niên": { label: "Supportive · Harmony", house: "Balanced energy that helps household members stay aligned and harmonious.", stove: "Supports steady daily rhythm and warm family relationships." },
  "Phục Vị": { label: "Steady · Calm focus", house: "Quiet, grounded sector suited to study, reflection, and calm routines.", stove: "Neutral and steady; keep the kitchen bright, clean, and well-ventilated." },
  "Hoạ Hại": { label: "Mild friction", house: "Minor door–master mismatch; prioritize placing the stove in a supportive sector.", stove: "Less supportive stove sector; keep it tidy, airy, or face the stove mouth well." },
  "Lục Sát": { label: "Needs layout balance", house: "Flow between door and master room can feel restless; soften lighting and balance via stove placement.", stove: "Can add minor friction to shared routines; keep dry, well-lit, and prioritize bedroom direction." },
  "Ngũ Quỷ": { label: "High tension · Balance advised", house: "Clashing sectors can feel tiring or hurried; use a supportive stove sector to settle the layout.", stove: "Strong fire clash; when renovating, prefer one of the suggested supportive stove sectors." },
  "Tuyệt Mệnh": { label: "Strong clash · Priority fix", house: "Strongest East/West group mismatch; per Yangzhai Sanyao, placing the stove in a supportive sector is the first adjustment.", stove: "Clashes strongly with the main door; prefer one of the suggested supportive stove sectors." },
};

interface SoDoNhaRes {
  ma: string; cua: string; chu: string; huong_cua: string; huong_chu: string;
  du_nien: string; cung_nhom: boolean; quan_he_ngu_hanh: string;
  bep_hop: string[]; bep_nen_tranh: string[]; tom_y?: string;
  nhan_doi_thuong?: string; dien_giai_doi_thuong?: string;
}
interface SoDoBepRes {
  ma: string; bep: string; cua: string; huong_bep: string; huong_cua: string;
  du_nien: string; hanh_bep: string; hanh_cua: string; quan_he_ngu_hanh: string; tom_y?: string;
  nhan_doi_thuong?: string; dien_giai_doi_thuong?: string;
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
interface DoHinhChiTiet extends DoHinhItem {
  cau_truc?: Record<string, unknown>;
  mermaid?: string;
}

function mucTuDuNien(dn?: string | null): Muc | null {
  if (!dn) return null;
  return DU_NIEN_CAT.has(dn) ? "thuan" : "can_chu_dong";
}

function hienGiaTriCauTruc(val: unknown): string {
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (Array.isArray(item)) return `[${item.join(" · ")}]`;
        if (item && typeof item === "object") {
          return Object.values(item as Record<string, unknown>).join(" · ");
        }
        return String(item);
      })
      .join(" | ");
  }
  return "";
}

export function TamYeuCuaChuBep({ huongCuaGoiY }: { huongCuaGoiY?: string | null }) {
  const { en, huong: tenHuong, duNien: tenDuNien, quai: tenQuai } = useChuPT();
  const hoSoNha = useHoSoNha();
  const [cua, setCua] = useState<Quai8>("Càn");
  const [chu, setChu] = useState<Quai8>("Đoài");
  const [bep, setBep] = useState<Quai8>("Khôn");
  const [kq, setKq] = useState<TamYeuRes | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [daLuu, setDaLuu] = useState(false);
  const [doHinh, setDoHinh] = useState<DoHinhItem[] | null>(null);
  const [moDoHinh, setMoDoHinh] = useState(false);
  const [chiTietMa, setChiTietMa] = useState<string | null>(null);
  const [chiTietCache, setChiTietCache] = useState<Record<string, DoHinhChiTiet>>({});
  const daDienHoSo = useRef(false);

  // Tự điền sẵn từ Hồ sơ nhà trên máy (một lần duy nhất; chỉ lấy hướng Cửa khi theo === "cua", không lấy hướng ban công).
  useEffect(() => {
    if (daDienHoSo.current || !hoSoNha) return;
    daDienHoSo.current = true;
    if (hoSoNha.theo === "cua" && hoSoNha.huong && QUAI_TU_HUONG[hoSoNha.huong]) setCua(QUAI_TU_HUONG[hoSoNha.huong]!);
    const vt = hoSoNha.bo_cuc?.vi_tri;
    if (vt?.phong_ngu_chinh && QUAI_TU_HUONG[vt.phong_ngu_chinh]) setChu(QUAI_TU_HUONG[vt.phong_ngu_chinh]!);
    if (vt?.bep && QUAI_TU_HUONG[vt.bep]) setBep(QUAI_TU_HUONG[vt.bep]!);
  }, [hoSoNha]);

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
    const q = (val in HUONG_TU_QUAI ? val : null) as Quai8 | null;
    if (!q) return;
    setDaLuu(false);
    if (loai === "cua") setCua(q);
    else if (loai === "chu") setChu(q);
    else setBep(q);
    ghi("chart_interacted", {
      mo_dun: "phongthuy",
      kind: "tam_yeu_so_do",
      cua: loai === "cua" ? q : cua,
      chu: loai === "chu" ? q : chu,
      bep: loai === "bep" ? q : bep,
    });
  };

  const apDungVaoHoSoNha = () => {
    try {
      luuHoSoNha({
        huong: HUONG_TU_QUAI[cua],
        bo_cuc: {
          ...(hoSoNha?.bo_cuc ?? {}),
          vi_tri: {
            ...(hoSoNha?.bo_cuc?.vi_tri ?? {}),
            phong_ngu_chinh: HUONG_TU_QUAI[chu],
            bep: HUONG_TU_QUAI[bep],
          },
        },
      });
      setDaLuu(true);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "tam_yeu_ap_dung_ho_so", cua, chu, bep });
      document.getElementById("nha-cua-ban")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      /* chế độ riêng tư */
    }
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

  const xemChiTietDoHinh = (ma: string) => {
    if (chiTietMa === ma) { setChiTietMa(null); return; }
    setChiTietMa(ma);
    if (!chiTietCache[ma]) {
      fetch(`/api/phongthuy/tam-yeu/do-hinh?ma=${encodeURIComponent(ma)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.ma) setChiTietCache((prev) => ({ ...prev, [ma]: d as DoHinhChiTiet }));
        })
        .catch(() => null);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "tam_yeu_do_hinh_chi_tiet", ma });
    }
  };

  const nha = kq?.so_do_nha;
  const sdBep = kq?.so_do_bep;
  const phong: PhongTrenSoDo[] = [
    { cung: HUONG_TU_QUAI[cua], ten: en ? `Door (${tenQuai(cua)})` : `Cửa (${cua})`, muc: "can_bang" },
    { cung: HUONG_TU_QUAI[chu], ten: en ? `Master (${tenQuai(chu)})` : `Phòng chủ (${chu})`, muc: mucTuDuNien(nha?.du_nien) },
    { cung: HUONG_TU_QUAI[bep], ten: en ? `Stove (${tenQuai(bep)})` : `Bếp (${bep})`, muc: mucTuDuNien(sdBep?.du_nien) },
  ];
  const duNienMap: Record<string, string | null> = {};
  if (nha) duNienMap[nha.huong_chu] = nha.du_nien;
  if (sdBep) duNienMap[sdBep.huong_bep] = sdBep.du_nien;
  const nhaEn = nha ? EN_DU_NIEN_MEANING[nha.du_nien] : undefined;
  const bepEn = sdBep ? EN_DU_NIEN_MEANING[sdBep.du_nien] : undefined;

  return (
    <section
      id="tam-yeu"
      aria-label={en ? "Yangzhai Sanyao — Door, Master Room & Stove Layout" : "Dương Trạch Tam Yếu — Sơ đồ Cửa, Chủ, Bếp"}
      data-testid="tam-yeu-cua-chu-bep"
      className="glass rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold">
            {en ? "Yangzhai Sanyao · Zhao Jiufeng (Qing)" : "Dương Trạch Tam Yếu · Triệu Cửu Phong"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-fg sm:text-2xl">
            {en ? "Quick Door – Master – Stove Layout Check" : "Tra nhanh thế nhà Cửa – Chủ – Bếp"}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            {en ? (
              <>Pick your <b>Main Door</b>, <b>Master Room</b>, and <b>Stove</b> sectors (no sign-in required) to preview the 3×3 Nine-Palace grid and recommended stove sectors.</>
            ) : (
              <>Chọn vị trí <b>Cửa chính</b>, <b>Phòng chủ</b> và <b>Bếp nấu</b> theo 8 phương (dùng ngay không cần đăng nhập) để xem sơ đồ Cửu Cung 3×3 và gợi ý đặt bếp.</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={taiDoHinh}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-gold hover:text-fg"
        >
          <BookOpen className="size-3.5 text-gold" aria-hidden />
          {moDoHinh
            ? (en ? "Hide 10 classical diagrams" : "Ẩn 10 đồ hình cổ")
            : (en ? "View 10 classical diagrams" : "Xem 10 đồ hình lý thuyết")}
        </button>
      </div>

      {/* Bộ chọn 3 chạm: Cửa – Chủ – Bếp */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(
          [
            { key: "cua" as const, label: en ? "1. Main Door (Men)" : "1. Cửa chính (Môn)", val: cua, icon: Compass },
            { key: "chu" as const, label: en ? "2. Master Room (Zhu)" : "2. Phòng chủ (phòng chính/ngủ chính)", val: chu, icon: Home },
            { key: "bep" as const, label: en ? "3. Stove (Zao)" : "3. Bếp nấu (Táo)", val: bep, icon: Flame },
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
                    data-testid={`tam-yeu-${key}-${q.quai}`}
                    onClick={() => chonMuc(key, q.quai)}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-left text-xs transition-colors motion-reduce:transition-none",
                      active
                        ? "border-gold bg-gold/15 font-medium text-fg"
                        : "border-line/60 text-fg-muted hover:border-line hover:text-fg"
                    )}
                  >
                    <span>{en ? tenQuai(q.quai) : q.quai}</span>
                    <span className="ml-1 text-[10px] text-fg-faint">({en ? tenHuong(q.huong) : q.huong})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {loi && <p className="mt-4 text-sm text-cinnabar">{en ? "Could not load the Three-Essentials layout right now. Please retry." : loi}</p>}

      {/* Lưới Cửu Cung 3×3 (tái sử dụng SoDoNha) + Giải nghĩa đời thường trước, học thuật gập sau */}
      <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,22rem)_1fr]">
        <SoDoNha
          phong={phong}
          huongNha={HUONG_TU_QUAI[cua]}
          duNien={duNienMap}
          tieuDe={en ? `Layout: Door ${tenQuai(cua)}, Master ${tenQuai(chu)}, Stove ${tenQuai(bep)}` : `Sơ đồ Tam Yếu: Cửa ${cua}, Chủ ${chu}, Bếp ${bep}`}
          className="mx-auto"
        />

        <div className="space-y-3" aria-live="polite">
          {dangTai && !kq && <p className="text-sm text-fg-muted">{en ? "Calculating layout from engine…" : "Đang tra sơ đồ từ máy tính toán…"}</p>}

          {nha && (
            <div data-testid="tam-yeu-the-nha" className={cn("rounded-xl border p-4", nha.cung_nhom ? "border-jade/40 bg-jade/5" : "border-cinnabar/35 bg-cinnabar/5")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-fg">
                  {en
                    ? `House pairing: Door ${tenQuai(nha.cua)} (${tenHuong(nha.huong_cua)}) → Master ${tenQuai(nha.chu)} (${tenHuong(nha.huong_chu)})`
                    : `Thế nhà: Cửa ${nha.cua} (${nha.huong_cua}) → Chủ ${nha.chu} (${nha.huong_chu})`}
                </p>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", nha.cung_nhom ? "bg-jade/15 text-jade" : "bg-cinnabar/15 text-cinnabar")}>
                  {en ? (nhaEn?.label ?? tenDuNien(nha.du_nien)) : (nha.nhan_doi_thuong ?? nha.du_nien)}
                </span>
              </div>
              {en ? (
                nhaEn && <p className="mt-2 text-sm leading-relaxed text-fg">{nhaEn.house}</p>
              ) : (
                <>
                  {nha.dien_giai_doi_thuong && <p className="mt-2 text-sm leading-relaxed text-fg">{nha.dien_giai_doi_thuong}</p>}
                  {nha.tom_y && <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">Theo sách xưa: {nha.tom_y}</p>}
                </>
              )}

              {nha.bep_hop.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs" data-testid="tam-yeu-bep-hop">
                  <span className="text-fg-muted">{en ? "Supportive stove:" : "Bếp hợp:"}</span>
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
                      {en ? `${tenQuai(q)} (${tenHuong(HUONG_TU_QUAI[q as Quai8] ?? q)})` : `${q} (${HUONG_TU_QUAI[q as Quai8] ?? q})`}
                    </button>
                  ))}
                </div>
              )}

              {nha.bep_nen_tranh.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs" data-testid="tam-yeu-bep-tranh">
                  <span className="text-fg-muted">{en ? "Stove to avoid:" : "Bếp nên tránh:"}</span>
                  {nha.bep_nen_tranh.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => chonMuc("bep", q)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 transition-colors",
                        bep === q ? "border-cinnabar bg-cinnabar/20 font-medium text-cinnabar" : "border-cinnabar/35 text-cinnabar hover:bg-cinnabar/10"
                      )}
                    >
                      {en ? `${tenQuai(q)} (${tenHuong(HUONG_TU_QUAI[q as Quai8] ?? q)})` : `${q} (${HUONG_TU_QUAI[q as Quai8] ?? q})`}
                    </button>
                  ))}
                </div>
              )}

              <details className="mt-2.5 text-xs text-fg-muted">
                <summary className="cursor-pointer text-gold">
                  {en ? `Why this reading (${tenDuNien(nha.du_nien)} · Eight Mansions)` : "Vì sao nói vậy (Bát Trạch & Ngũ Hành)"}
                </summary>
                <p className="mt-1 leading-relaxed">
                  {en
                    ? (nha.cung_nhom ? "Door and Master room belong to the same East/West group." : "Door and Master room belong to opposite East/West groups.")
                    : <>{nha.cung_nhom ? "Cửa và Phòng chủ cùng nhóm Đông/Tây Tứ Trạch" : "Cửa và Phòng chủ khác nhóm Đông/Tây Tứ Trạch"} · Quan hệ ngũ hành: <b>{nha.quan_he_ngu_hanh}</b>.</>}
                </p>
              </details>
            </div>
          )}

          {sdBep && (
            <div data-testid="tam-yeu-the-bep" className={cn("rounded-xl border p-4", DU_NIEN_CAT.has(sdBep.du_nien) ? "border-jade/35 bg-jade/5" : "border-line bg-surface/40")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-fg">
                  {en
                    ? `Stove pairing: Stove ${tenQuai(sdBep.bep)} (${tenHuong(sdBep.huong_bep)}) with Door ${tenQuai(sdBep.cua)}`
                    : `Thế bếp: Bếp ${sdBep.bep} (${sdBep.huong_bep}) phối Cửa ${sdBep.cua}`}
                </p>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", DU_NIEN_CAT.has(sdBep.du_nien) ? "bg-jade/15 text-jade" : "bg-cinnabar/15 text-cinnabar")}>
                  {en ? (bepEn?.label ?? tenDuNien(sdBep.du_nien)) : (sdBep.nhan_doi_thuong ?? sdBep.du_nien)}
                </span>
              </div>
              {en ? (
                bepEn && <p className="mt-2 text-sm leading-relaxed text-fg">{bepEn.stove}</p>
              ) : (
                <>
                  {sdBep.dien_giai_doi_thuong && <p className="mt-2 text-sm leading-relaxed text-fg">{sdBep.dien_giai_doi_thuong}</p>}
                  {sdBep.tom_y && <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">Theo sách xưa: {sdBep.tom_y}</p>}
                </>
              )}
              <details className="mt-2 text-xs text-fg-muted">
                <summary className="cursor-pointer text-gold">
                  {en ? `Why this reading (${tenDuNien(sdBep.du_nien)} · Five Elements)` : `Vì sao nói vậy (${sdBep.du_nien} · Ngũ Hành)`}
                </summary>
                <p className="mt-1">
                  {en
                    ? `Classical star: ${tenDuNien(sdBep.du_nien)}.`
                    : `Bếp hành ${sdBep.hanh_bep} · Cửa hành ${sdBep.hanh_cua} · ${sdBep.quan_he_ngu_hanh}.`}
                </p>
              </details>
            </div>
          )}

          {/* CTA 1 chạm: lưu vào Hồ sơ nhà + dẫn xuống báo cáo đầy đủ Nhà của bạn */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs">
            <span className="text-fg-muted">
              {en ? (
                <>Combine this layout with <b>all family members</b>, <b>construction period (Flying Stars)</b>, and <b>3-month forecast</b>:</>
              ) : (
                <>Ghép tổ hợp này với <b>tuổi cả gia đình</b>, <b>năm xây (Huyền Không)</b> và <b>3 tháng tới</b>:</>
              )}
            </span>
            <button
              type="button"
              data-testid="tam-yeu-ap-dung"
              onClick={apDungVaoHoSoNha}
              className="inline-flex items-center gap-1 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-medium text-gold transition-colors hover:bg-gold/25"
            >
              {daLuu ? (
                <><Check className="size-3.5" aria-hidden /> {en ? "Saved to House Profile" : "Đã lưu vào Hồ sơ nhà"}</>
              ) : (
                <>{en ? "Save to House Profile & View Report" : "Lưu vào Hồ sơ nhà & Xem báo cáo"} <ArrowDown className="size-3.5" aria-hidden /></>
              )}
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-fg-faint">
            {en
              ? "Reference: Yangzhai Sanyao (Zhao Jiufeng, Qing dynasty) — spatial layout guidance only, not fortune-telling and no ritual objects required."
              : `Nguồn: ${kq?.nguon_hien_thi ?? "Dương Trạch Tam Yếu (Triệu Cửu Phong, đời Thanh)"} — mang tính tham khảo bố trí không gian, không phải lời phán hung cát và không cần mua vật phẩm hoá giải.`}
          </p>
        </div>
      </div>

      {/* Ngăn 10 đồ hình lý thuyết cổ — bấm từng thẻ để xem cấu trúc chi tiết từ engine */}
      {moDoHinh && (
        <div className="mt-5 border-t border-line pt-4" data-testid="tam-yeu-do-hinh-list">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-fg-muted">
            10 đồ hình lý thuyết nền tảng · bấm từng đồ hình để xem cấu trúc
          </p>
          {!doHinh ? (
            <p className="text-xs text-fg-muted">Đang tải danh mục đồ hình…</p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {doHinh.map((item) => {
                const dangMo = chiTietMa === item.ma;
                const ct = chiTietCache[item.ma];
                return (
                  <div key={item.ma} className={cn("rounded-xl border p-3 transition-colors", dangMo ? "border-gold/60 bg-gold/5" : "border-line/70 bg-surface/40")}>
                    <button
                      type="button"
                      onClick={() => xemChiTietDoHinh(item.ma)}
                      aria-expanded={dangMo}
                      className="flex w-full items-start justify-between gap-2 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-fg">{item.ten}</p>
                        <p className="mt-0.5 text-[11px] text-gold" lang="zh-Hant">{item.ten_han}</p>
                      </div>
                      <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-fg-muted transition-transform motion-reduce:transition-none", dangMo && "rotate-180")} aria-hidden />
                    </button>
                    <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{item.mo_ta}</p>
                    {dangMo && (
                      <div className="mt-2.5 border-t border-line/60 pt-2 text-xs text-fg-muted">
                        {!ct ? (
                          <p>Đang tải cấu trúc đồ hình…</p>
                        ) : ct.cau_truc ? (
                          <ul className="space-y-1">
                            {Object.entries(ct.cau_truc).map(([k, v]) => (
                              <li key={k}>
                                <span className="font-medium text-fg">{k.replace(/_/g, " ")}:</span>{" "}
                                <span>{hienGiaTriCauTruc(v)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
