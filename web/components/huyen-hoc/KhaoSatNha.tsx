"use client";
// PT-V0 — "Khảo sát nhà": người dùng tự khai bố cục (phòng nằm ở phương nào nhìn từ tâm nhà, dấu hiệu quan sát được,
// hướng vật dụng). Web chỉ gom lựa chọn thành JSON bố cục; engine luận Bát trạch + kho tình huống (có nguồn).
// Cùng JSON này sau này sẽ do ảnh/video điền sẵn (PT-V2) — người dùng chỉ việc xác nhận.
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";
import { SachXuaGhi, type KhoiSachGhi } from "@/components/huyen-hoc/SachXuaGhi";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/khung/Lien";
import { Check, ClipboardList, Home, Ruler, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, soDoGui, useHoSoNha } from "@/lib/ho-so-nha";
import { datGocNhin, TEN_GOC_NHIN, useGocNhin, type GocNhin } from "@/lib/goc-nhin-pt";
import { cn } from "@/lib/utils";
import { SoDoNha } from "@/components/huyen-hoc/SoDoNha";
import { CachLam } from "@/components/huyen-hoc/CachLam";
import { HoiNhanhAnh } from "@/components/huyen-hoc/HoiNhanhAnh";
import { DocAnhNha } from "@/components/huyen-hoc/DocAnhNha";
import { ChanQr } from "@/components/khung/ChanQr";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { TenHienProvider } from "@/components/khung/TenHien";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";
import { useDuong } from "@/components/khung/NgonNgu";
import type { TenHien } from "@/lib/ten-hien";

interface DanhMuc {
  phong: Record<string, string>;
  cung: string[];
  dau_hieu: { ma: string; hoi: string; nhom: string; tot?: boolean }[];
  vat_huong: Record<string, string>;
}
interface ViTri { phong: string; ten: string; cung: string; du_nien_menh: string | null; du_nien_trach: string | null; nen: "cat" | "hung"; hop: boolean | null }
interface Viec { chi_phi: "khong_ton" | "it_tien" | "sua_chua"; lam: string }
interface MatBangKq {
  /** TY-2 đợt 2: "so_do" = đọc từ sơ đồ tỉ lệ (tam = x, y 0..1); không có = lưới vẽ tay cũ (tam_o, so_o theo ô). */
  nguon?: "so_do";
  tam: number[]; tam_o?: number[]; tam_ngoai_nha: boolean; so_o?: number; khuyet_goc: string[]; dau_hieu_suy_ra: string[];
  o_9: { hang: number; cot: number; ti_le: number; phuong: string | null; khuyet: boolean }[];
  phuong_phong: Record<string, { o?: number[]; diem?: number[]; phuong: string | null; trung_cung: boolean }>;
  wc_trung_cung: boolean; cua_thong_ban_cong: { lech_do: number; thang_hang: boolean } | null; canh_bao: string[];
  /** Gói 1 (SD-1): dấu hiệu sơ đồ GỢI Ý — chưa luận cho tới khi người dùng xác nhận. */
  dau_hieu_goi_y?: { ma: string; hoi: string }[];
}
interface KetQua {
  /** Q1 / Q2 / Q4 / Q5 / Q6 */
  veto_da_xac_nhan: string[]; mat_bang: MatBangKq | null; quy_tac: { ma: string; tieu_de: string; noi_dung: string }[];
  /** SX-C: câu sách xưa theo dấu hiệu đã xác nhận và cặp cửa – phòng chính – bếp. */
  sach_ghi?: KhoiSachGhi | null;
  goc_nhin: GocNhin; chi_phi: Record<string, string>;
  da_tinh: {
    huong_nha: string | null; trach: { quai: string; nhom: string; toa: string } | null;
    menh_quai: { quai: string; nhom: string } | null; cung_nhom: boolean | null;
    vi_tri: ViTri[];
    huong: { doi_tuong: string; do: number; huong: string; du_nien: string | null; cat: boolean | null }[];
    cua_chu_bep: { cap: { cap: string; du_nien: string; cat: boolean }[]; cung_nhom: boolean } | null;
  };
  dien_giai: {
    vi_tri: { phong: string; tieu_de: string; noi_dung: string; thuc_te: string; nguon: string }[];
    huong: { doi_tuong: string; tieu_de: string; noi_dung: string }[];
    dau_hieu: { ma: string; tot: boolean; tieu_de: string; noi_dung: string; goi_y: string; nguon: string; veto: boolean;
      giai_thich: { sach_xua: string; doi_song: string }; viec: Viec[]; tu_mat_bang: boolean; trang?: string }[];
  };
  tu_soi: string[];
  luu_y: string;
  trang_thai: string;
  ten_hien?: TenHien;
}

// Lưới 3×3 theo bản đồ: Bắc ở trên, Đông bên phải.
const LUOI = ["Tây Bắc", "Bắc", "Đông Bắc", "Tây", "Trung cung", "Đông", "Tây Nam", "Nam", "Đông Nam"];
const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
// Nhãn ở bảng chữ lib/chu/phong-thuy.ts: nhóm dấu hiệu `ks.nhom.<mã>`, nguồn `ks.nguon.<mã>`, loại nhà `ks.loai.<mã>`.
const NHOM_DH = ["ngoai_canh", "hinh_nha", "trong_nha"] as const;
const NGUON = new Set(["co_thu", "dan_gian"]);
const LOAI_NHA = ["", "can_ho", "nha_pho", "biet_thu", "nha_cap4", "khac"] as const;
// TY-2 đợt 2: MỘT bản vẽ — Khảo sát nhà đọc sơ đồ tỉ lệ của "Đứng giữa nhà" (hồ sơ nhà: `khung` + điểm tầng trệt), không còn
// lưới 6×6 riêng. Nhãn chỗ trên sơ đồ: bảng chữ `dv.ten.<mã>`; mức chi phí `ks.cp.<mã>`.

export function KhaoSatNha({ sinh, doHuongGoiY }: {
  sinh: { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;
  doHuongGoiY: number | null;
}) {
  const [dm, setDm] = useState<DanhMuc | null>(null);
  const [huong, setHuong] = useState<string>("");
  const [doNha, setDoNha] = useState("");
  const [viTri, setViTri] = useState<Record<string, string>>({});
  const [phongChon, setPhongChon] = useState("cua_chinh");
  const [dau, setDau] = useState<Set<string>>(new Set());
  // PT-V2: dấu hiệu người dùng bấm "Đúng" cho gợi ý từ ảnh (gửi nguon:"anh", xac_nhan:true — tập con của `dau`);
  // "Không" → khongCo (gửi co:false, nguon:"nguoi_dung" — người dùng khai rõ, thắng suy luận mặt bằng, UI-PT 4).
  // Gợi ý CHƯA bấm không đi vào bố cục. Chỉ mã, không ảnh.
  const [tuAnh, setTuAnh] = useState<Set<string>>(new Set());
  const [khongCo, setKhongCo] = useState<Set<string>>(new Set());
  const [daTraLoi, setDaTraLoi] = useState<Record<string, boolean>>({});
  const [anhGoiY, setAnhGoiY] = useState<File | null>(null);
  const [yDinhNhanh, setYDinhNhanh] = useState<string | null>(null);
  const [huongDo, setHuongDo] = useState<Record<string, string>>({});
  const [kq, setKq] = useState<KetQua | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [loaiNha, setLoaiNha] = useState("");
  const gocNhin = useGocNhin();
  const { c: t, en, huong: tenHuong } = useChuPT();
  useEffect(() => {
    fetch(urlTheoNgonNgu("/api/phongthuy/bo-cuc/danh-muc")).then((r) => (r.ok ? r.json() : null)).then(setDm).catch(() => setDm(null));
  }, []);
  useEffect(() => { if (doHuongGoiY != null) setDoNha(String(doHuongGoiY)); }, [doHuongGoiY]);
  // KC-2: bố cục đã khai lần trước (hồ sơ nhà trên máy) điền sẵn một lần.
  const nhaLuu = useHoSoNha();
  // UI-PT2 P5: điền lại khi đổi CĂN đang xem (id khác); UI-PT2 A: loại nhà luôn theo hồ sơ nhà (chọn ở Hành trình).
  const daDien = useRef<string | null>(null);
  useEffect(() => { if (nhaLuu?.loai_nha) setLoaiNha(nhaLuu.loai_nha); }, [nhaLuu?.loai_nha]);
  // Hướng nhà vừa có trong hồ sơ nhà (đo / nhập ở phần trên) sau lần điền đầu → ô hướng còn trống thì điền, không bắt nhập lại.
  const huongDoLuu = nhaLuu?.huong_do, huongLuu = nhaLuu?.huong;
  useEffect(() => {
    if (doHuongGoiY != null) return;
    if (huongDoLuu != null) setDoNha((c) => (c === "" ? String(huongDoLuu) : c));
    else if (huongLuu) setHuong((c) => (c === "" ? huongLuu : c));
  }, [huongDoLuu, huongLuu, doHuongGoiY]);
  useEffect(() => {
    const khoa = nhaLuu ? `${nhaLuu.id ?? "_"}` : null;
    if (!nhaLuu || daDien.current === khoa) return;
    const doiCan = daDien.current !== null && daDien.current !== "_" && khoa !== "_";
    const lanDau = daDien.current === null;
    daDien.current = khoa;
    if (!lanDau && !doiCan) return;
    if (nhaLuu.huong_do != null && doHuongGoiY == null) setDoNha(String(nhaLuu.huong_do)); else if (nhaLuu.huong && doHuongGoiY == null) setHuong(nhaLuu.huong);
    const b = nhaLuu.bo_cuc;
    if (b?.vi_tri || doiCan) setViTri(b?.vi_tri ?? {});
    if (b?.dau_hieu || doiCan) setDau(new Set(b?.dau_hieu ?? []));
    if (b?.tu_anh || b?.khai_khong || doiCan) {
      setTuAnh(new Set((b?.tu_anh ?? []).filter((m) => (b?.dau_hieu ?? []).includes(m))));
      setKhongCo(new Set((b?.khai_khong ?? []).filter((m) => !(b?.dau_hieu ?? []).includes(m))));
      setDaTraLoi({});
    }
    if (b?.huong_do || doiCan) setHuongDo(Object.fromEntries(Object.entries(b?.huong_do ?? {}).map(([k, v]) => [k, String(v)])));
    if (nhaLuu.loai_nha) setLoaiNha(nhaLuu.loai_nha);
    if (doiCan) setKq(null);
  }, [nhaLuu, doHuongGoiY]);

  // SD-1: khối sơ đồ nhà theo tỉ lệ vừa lưu câu trả lời Có / Không cho dấu hiệu nó gợi ý (hồ sơ nhà: `tu_so_do`,
  // `khai_khong`) → ô tích ở đây theo ngay, để lần "Xem luận bố cục" kế tiếp không ghi đè mất câu trả lời ấy.
  const khoaSoDo = `${(nhaLuu?.bo_cuc?.tu_so_do ?? []).join(",")}|${(nhaLuu?.bo_cuc?.khai_khong ?? []).join(",")}`;
  const soDoTruoc = useRef<{ khoa: string; tu: string[]; khong: string[] } | null>(null);
  useEffect(() => {
    if (nhaLuu === undefined) return;
    const b = nhaLuu?.bo_cuc;
    const tu = b?.tu_so_do ?? [];
    const dangCo = b?.dau_hieu ?? [];
    const khongLuu = (b?.khai_khong ?? []).filter((m) => !dangCo.includes(m));
    const truoc = soDoTruoc.current;
    soDoTruoc.current = { khoa: khoaSoDo, tu, khong: khongLuu };
    if (!truoc || truoc.khoa === khoaSoDo) return;            // lần đầu: khối điền hồ sơ ở trên đã lo
    // Chỉ theo phần VỪA đổi trong hồ sơ (không đụng ô người dùng mới tích tay mà chưa lưu).
    const them = tu.filter((m) => !truoc.tu.includes(m));
    const khong = khongLuu.filter((m) => !truoc.khong.includes(m));
    const bo = [...truoc.tu.filter((m) => !tu.includes(m) && !dangCo.includes(m)), ...khong];
    setDau((s) => {
      if (them.every((m) => s.has(m)) && !bo.some((m) => s.has(m))) return s;
      const n = new Set(s); them.forEach((m) => n.add(m)); bo.forEach((m) => n.delete(m)); return n;
    });
    setKhongCo((s) => {
      if (khong.every((m) => s.has(m)) && !them.some((m) => s.has(m))) return s;
      const n = new Set(s); khong.forEach((m) => n.add(m)); them.forEach((m) => n.delete(m)); return n;
    });
  }, [khoaSoDo, nhaLuu]);

  // PT-V2: người dùng xác nhận một gợi ý từ ảnh. Đúng → tích ô + đánh dấu "từ ảnh"; Không → bỏ tích + khai rõ không có.
  const xacNhanAnh = (ma: string, dung: boolean) => {
    setDaTraLoi((t) => ({ ...t, [ma]: dung }));
    setDau((s0) => { const n = new Set(s0); if (dung) n.add(ma); else n.delete(ma); return n; });
    setTuAnh((s0) => { const n = new Set(s0); if (dung) n.add(ma); else n.delete(ma); return n; });
    setKhongCo((s0) => { const n = new Set(s0); if (dung) n.delete(ma); else n.add(ma); return n; });
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "doc_anh_xac_nhan", ma, dung: dung ? 1 : 0 });
  };
  // Tích / bỏ tích tay một ô: tích tay = nguồn người dùng (bỏ cờ "từ ảnh", bỏ khai "không có"); bỏ tích = bỏ cờ từ ảnh.
  const tichO = (ma: string, co: boolean) => {
    setDau((s) => { const n = new Set(s); if (co) n.add(ma); else n.delete(ma); return n; });
    setTuAnh((s) => { if (!s.has(ma)) return s; const n = new Set(s); n.delete(ma); return n; });
    if (co) setKhongCo((s) => { if (!s.has(ma)) return s; const n = new Set(s); n.delete(ma); return n; });
  };

  const dat = (cung: string) => setViTri((v) => {
    const m = { ...v };
    if (m[phongChon] === cung) delete m[phongChon]; else m[phongChon] = cung;
    return m;
  });

  const gui = async () => {
    setLoi(null);
    const so = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
    const d = so(doNha);
    if (d != null && !(d >= 0 && d < 360)) { setLoi(t("ks.loi_do")); return; }
    const hd: Record<string, number> = {};
    for (const [k, v] of Object.entries(huongDo)) {
      const x = so(v);
      if (x == null) continue;
      if (!(x >= 0 && x < 360)) { setLoi(t("ks.loi_do_vat")); return; }
      hd[k] = x;
    }
    const soDo = soDoGui(nhaLuu);
    const daXuLy = (nhaLuu?.bo_cuc?.da_xu_ly ?? []).filter((m) => !dau.has(m));   // tích lại = chưa xử lý nữa
    // PT-V2: "Không" cho gợi ý từ ảnh → co:false như đã xử lý (người dùng khai rõ); không trùng mã đã tích.
    const khongCoGui = [...khongCo].filter((m) => !dau.has(m));
    const khaiKhong = [...new Set([...daXuLy, ...khongCoGui])];
    const tuAnhGui = [...tuAnh].filter((m) => dau.has(m));
    const tuSoDoGiu = (nhaLuu?.bo_cuc?.tu_so_do ?? []).filter((m) => dau.has(m));
    if (d == null && !huong && Object.keys(viTri).length === 0 && dau.size === 0 && !soDo) {
      setLoi(t("ks.loi_thieu")); return;
    }
    setDang(true);
    try {
      const r = await postJson<KetQua>("/api/phongthuy/bo-cuc", {
        bo_cuc: {
          ...(d != null ? { huong_nha_do: d } : huong ? { huong_nha: huong } : {}),
          ...(loaiNha ? { loai_nha: loaiNha } : {}),
          vi_tri: viTri, huong_do: hd,
          // UI-PT 4: dấu hiệu đã bấm "Tôi đã xử lý" ở bài đọc (hồ sơ nhà) gửi co:false → engine không luận lại dù mặt bằng suy ra.
          dau_hieu: Object.fromEntries([
            ...[...dau].map((m) => [m, tuAnh.has(m) ? { co: true, nguon: "anh", xac_nhan: true } : { co: true, nguon: "nguoi_dung" }]),
            ...khaiKhong.map((m) => [m, { co: false, nguon: "nguoi_dung" }])]),
          // TY-2 đợt 2: phương phòng, Trung cung, khuyết góc, cửa thông ban công — engine đọc từ sơ đồ (phòng khai tay ở lưới 3×3 thắng).
          ...(soDo ? { so_do: soDo } : {}),
        },
        goc_nhin: gocNhin,
        ...(sinh ? { sinh } : {}),
      });
      setKq(r);
      try {
        luuHoSoNha({ ...(d != null ? { huong_do: d } : {}), ...(loaiNha ? { loai_nha: loaiNha as "can_ho" } : {}),
          bo_cuc: { vi_tri: viTri, huong_do: hd, dau_hieu: [...dau], ...(tuAnhGui.length ? { tu_anh: tuAnhGui } : {}),
            ...(khongCoGui.length ? { khai_khong: khongCoGui } : {}),
            // SD-1: giữ dấu vết "mã này đến từ sơ đồ nhà" (chỉ mã còn đang tích) để khối sơ đồ gỡ được khi sơ đồ đổi.
            ...(tuSoDoGiu.length ? { tu_so_do: tuSoDoGiu } : {}),
            ...(daXuLy.length ? { da_xu_ly: daXuLy } : {}) } });
      } catch { /* bỏ qua */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "khao_sat_nha", co_mat_bang: Boolean(soDo), loai_nha: loaiNha, goc_nhin: gocNhin });
    } catch (e) { setLoi(e instanceof Error ? e.message : t("ks.loi_luan")); }
    finally { setDang(false); }
  };

  return (
    <section className="glass rounded-2xl p-5" aria-labelledby="khao-sat-nha" data-testid="khao-sat-nha">
      <h2 id="khao-sat-nha" className="flex items-center gap-2 text-xl"><Home className="size-5 text-gold" aria-hidden /> {t("ks.tieu_de")}</h2>
      <p className="mt-1 text-sm text-fg-muted">
        {t("ks.mo_ta")}
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-fg">{t("ks.b1")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input aria-label={t("ks.do_aria")} inputMode="decimal" placeholder={t("ks.do_vi_du")} className="w-40"
                value={doNha} onChange={(e) => setDoNha(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} />
              <span className="text-xs text-fg-faint">{t("ks.hoac")}</span>
              <select aria-label={t("ks.huong_aria")} value={huong} onChange={(e) => setHuong(e.target.value)} disabled={doNha.trim() !== ""}
                className="h-10 rounded-full border border-line bg-surface/60 px-3 text-sm disabled:opacity-50">
                <option value="">{t("ks.chon_huong")}</option>
                {HUONG8.map((h) => <option key={h} value={h}>{tenHuong(h)}</option>)}
              </select>
              <select aria-label={t("ks.loai_aria")} value={loaiNha} onChange={(e) => setLoaiNha(e.target.value)}
                className="h-10 rounded-full border border-line bg-surface/60 px-3 text-sm">
                {LOAI_NHA.map((v) => <option key={v} value={v}>{t(`ks.loai.${v || "chon"}`)}</option>)}
              </select>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
              <span>{t("ks.giai_thich")}</span>
              {(Object.keys(TEN_GOC_NHIN) as GocNhin[]).map((g) => (
                <button key={g} type="button" aria-pressed={gocNhin === g} onClick={() => datGocNhin(g)} data-testid={`ks-goc-nhin-${g}`}
                  className={cn("rounded-full border px-2.5 py-0.5", gocNhin === g ? "border-gold/70 text-gold" : "border-line text-fg-muted hover:text-fg")}>{t(`goc.${g}`)}</button>
              ))}
            </div>
            <CachLam viec="dat_phong" className="mt-2" />
          </div>

          <SoDoTomTat soDo={soDoGui(nhaLuu)} />

          <div>
            <p className="text-sm font-medium text-fg">{t("ks.b2")}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("ks.chon_phong_aria")}>
              {Object.entries(dm?.phong ?? {}).map(([ma, ten]) => (
                <button key={ma} type="button" role="radio" aria-checked={phongChon === ma} onClick={() => setPhongChon(ma)}
                  className={cn("min-h-9 rounded-full border px-3 py-1.5 text-xs transition-colors", phongChon === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                  {ten}{viTri[ma] ? ` · ${tenHuong(viTri[ma])}` : ""}
                </button>
              ))}
            </div>
            <div className="mt-3 grid max-w-xs grid-cols-3 gap-1.5" aria-label={t("ks.so_do_aria")}>
              {LUOI.map((c) => {
                const o = Object.entries(viTri).filter(([, v]) => v === c).map(([k]) => dm?.phong[k] ?? k);
                return (
                  <button key={c} type="button" onClick={() => dat(c)} aria-label={t("ks.dat_aria", { phong: dm?.phong[phongChon] ?? "", cung: tenHuong(c) })}
                    className={cn("flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-center",
                      c === "Trung cung" ? "border-line/60 bg-surface-2/40" : "border-line/70 bg-bg/30", o.length > 0 && "border-gold/70 bg-gold/10")}>
                    <span className="text-[10px] uppercase tracking-wide text-fg-faint">{tenHuong(c)}</span>
                    {o.map((t) => <span key={t} className="text-[11px] leading-tight text-fg">{t}</span>)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-fg">{t("ks.b3")}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {Object.entries(dm?.vat_huong ?? {}).map(([ma, ten]) => (
                <label key={ma} className="text-xs text-fg-muted">{ten}
                  <Input aria-label={ten} inputMode="decimal" placeholder={t("ks.vat_vi_du")} className="mt-1"
                    value={huongDo[ma] ?? ""} onChange={(e) => setHuongDo((h) => ({ ...h, [ma]: e.target.value.replace(/[^\d.,]/g, "").slice(0, 6) }))} />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <HoiNhanhAnh dau={dau} onDat={(ma, co) => { if (co == null) return; tichO(ma, co); if (!co) setKhongCo((s) => new Set(s).add(ma)); }}
            onChonAnh={setAnhGoiY} onYDinh={setYDinhNhanh} />
          {/* EN-ALL GĐ 5: gửi ảnh cho AI (PT-V2) tắt ở bản Anh. */}
          {!en && <DocAnhNha cauHoi={Object.fromEntries((dm?.dau_hieu ?? []).map((x) => [x.ma, x.hoi]))} tenPhong={dm?.phong ?? {}}
            loaiNha={loaiNha} yDinh={yDinhNhanh} anhGoiY={anhGoiY} dau={dau} daTraLoi={daTraLoi} onXacNhan={xacNhanAnh} />}
          <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-fg">{t("ks.b4")}</legend>
          {NHOM_DH.map((nhom) => (
            <div key={nhom}>
              <p className="eyebrow mt-2">{t(`ks.nhom.${nhom}`)}</p>
              <ul className="mt-1 space-y-1">
                {(dm?.dau_hieu ?? []).filter((x) => x.nhom === nhom).map((x) => (
                  <li key={x.ma}>
                    <label className="flex items-start gap-2 text-sm text-fg-muted">
                      <input type="checkbox" className="mt-1 size-4 accent-[rgb(var(--gold))]" checked={dau.has(x.ma)}
                        onChange={(e) => tichO(x.ma, e.target.checked)} />
                      <span>{x.hoi}
                        {dau.has(x.ma) && tuAnh.has(x.ma) && <span className="ml-1.5 rounded-full border border-gold/50 px-1.5 py-px text-[0.65rem] text-gold" data-testid={`chip-tu-anh-${x.ma}`}>{t("ks.tu_anh")}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </fieldset>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={gui} disabled={dang || !dm}><ClipboardList aria-hidden /> {dang ? t("ks.dang_luan") : t("ks.xem")}</Button>
        {!sinh && <p className="text-xs text-fg-faint">{t("ks.chua_sinh")}</p>}
        {loi && <p role="alert" className="text-sm text-cinnabar">{loi}</p>}
      </div>

      {kq && <TenHienProvider ten={[kq.ten_hien]}><KetQuaBoCuc kq={kq} daTra={new Set([...dau, ...khongCo])}
        onGoiY={(ma, co) => { if (co) tichO(ma, true); else setKhongCo((x) => new Set(x).add(ma)); }} /></TenHienProvider>}
    </section>
  );
}

function KetQuaBoCuc({ kq, daTra, onGoiY }: { kq: KetQua; daTra: Set<string>; onGoiY: (ma: string, co: boolean) => void }) {
  const d = kq.da_tinh;
  const giai = Object.fromEntries(kq.dien_giai.vi_tri.map((x) => [x.phong, x]));
  const { c: t, en, huong, quai, nhom, duNien } = useChuPT();
  const duong = useDuong();
  return (
    <div className="mt-6 space-y-5" data-testid="ket-qua-bo-cuc">
      <div>
        <p className="eyebrow">{t("ks.da_tinh")}</p>
        <p className="mt-1 text-sm">
          {d.trach ? <>{t("ks.nha_huong")}<b>{huong(d.huong_nha)}</b>{t("ks.toa", { toa: huong(d.trach.toa) })}<b className="text-gold">{t("ks.trach", { quai: quai(d.trach.quai) })}</b> ({nhom(d.trach.nhom)}). </> : t("ks.chua_huong")}
          {d.menh_quai && <>{t("ks.gia_chu")}<b className="text-gold">{quai(d.menh_quai.quai)}</b> ({nhom(d.menh_quai.nhom)}){d.cung_nhom != null && <> — {d.cung_nhom ? t("ks.cung_nhom") : t("ks.khac_nhom")}</>}.</>}
        </p>
        {d.vi_tri.length > 0 && (
          <SoDoNha className="mt-3" tieuDe={t("ks.so_do_td")} huongNha={d.huong_nha}
            duNien={Object.fromEntries(d.vi_tri.map((x) => [x.cung, x.du_nien_menh ?? x.du_nien_trach]))}
            phong={d.vi_tri.map((x) => ({ cung: x.cung, ten: x.ten, muc: x.hop == null ? null : x.hop ? "thuan" : "can_chu_dong" }))} />
        )}
        {d.vi_tri.length > 0 && (
          <ChanQr className="max-w-sm" nhan={t("ks.qr")} />
        )}
        {d.vi_tri.length > 0 && (
          <>
          {/* Điện thoại: mỗi phòng một thẻ (bảng 5 cột bị cắt ở 390px); từ sm trở lên giữ bảng. Chữ như bảng. */}
          <ul className="mt-2 space-y-2 sm:hidden" data-testid="ks-the-phong">
            {d.vi_tri.map((x) => (
              <li key={x.phong} className="rounded-xl border border-line/60 bg-bg/30 px-3 py-2 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <b className="text-fg">{x.ten}</b>
                  <span>{x.hop == null ? <span className="text-fg-faint">—</span> : x.hop
                    ? <span className="inline-flex items-center gap-1 text-jade"><Check className="size-3.5" aria-hidden />{t("ks.hop")}</span>
                    : <span className="inline-flex items-center gap-1 text-cinnabar"><X className="size-3.5" aria-hidden />{t("ks.chua_hop")}</span>}</span>
                </div>
                <p className="mt-0.5 text-fg-muted">{huong(x.cung)} · {duNien(x.du_nien_menh ?? x.du_nien_trach) || "—"}</p>
                <p className="text-xs text-fg-faint">{t("ks.cot_nen")}: {x.nen === "cat" ? t("ks.phuong_tot") : t("ks.phuong_xau")}</p>
              </li>
            ))}
          </ul>
          <div className="-mx-1 mt-2 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead><tr className="border-b border-line text-fg"><th className="py-1.5 pr-2">{t("ks.cot_phong")}</th><th className="pr-2">{t("ks.cot_phuong")}</th><th className="pr-2">{t("ks.cot_du_nien", { theo: d.menh_quai ? t("ks.theo_menh") : t("ks.theo_trach") })}</th><th className="pr-2">{t("ks.cot_nen")}</th><th>{t("ks.cot_danh_gia")}</th></tr></thead>
              <tbody>
                {d.vi_tri.map((x) => (
                  <tr key={x.phong} className="border-b border-line/50">
                    <td className="py-1.5 pr-2">{x.ten}</td><td className="pr-2">{huong(x.cung)}</td>
                    <td className="pr-2">{duNien(x.du_nien_menh ?? x.du_nien_trach) || "—"}</td>
                    <td className="pr-2 text-fg-muted">{x.nen === "cat" ? t("ks.phuong_tot") : t("ks.phuong_xau")}</td>
                    <td>{x.hop == null ? <span className="text-fg-faint">—</span> : x.hop
                      ? <span className="inline-flex items-center gap-1 text-jade"><Check className="size-3.5" aria-hidden />{t("ks.hop")}</span>
                      : <span className="inline-flex items-center gap-1 text-cinnabar"><X className="size-3.5" aria-hidden />{t("ks.chua_hop")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
        {d.huong.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {d.huong.map((h) => <li key={h.doi_tuong}>{kq.dien_giai.huong.find((x) => x.doi_tuong === h.doi_tuong)?.tieu_de}: {huong(h.huong)} ({h.do}°) — <b className={h.cat ? "text-jade" : "text-cinnabar"}>{duNien(h.du_nien) || "—"}</b></li>)}
          </ul>
        )}
        {d.cua_chu_bep && d.cua_chu_bep.cap.length > 0 && (
          <p className="mt-2 text-sm text-fg-muted">{t("ks.cua_chu_bep", { ds: d.cua_chu_bep.cap.map((c) => `${c.cap} ${duNien(c.du_nien)}`).join(" · ") })}{d.cua_chu_bep.cung_nhom ? t("ks.cung_mot_nhom") : t("ks.khong_cung_nhom")}</p>
        )}
      </div>

      <div>
        <p className="eyebrow">{t("ks.dien_giai")}</p>
        <ul className="mt-2 space-y-2">
          {d.vi_tri.filter((x) => x.hop === false).map((x) => (
            <li key={x.phong} className="rounded-xl border border-cinnabar/30 bg-cinnabar/5 px-4 py-2.5 text-sm">
              <b className="text-fg">{t("ks.o_phuong", { tieu_de: giai[x.phong]?.tieu_de ?? "", x: duNien(x.du_nien_menh ?? x.du_nien_trach) })}</b>: {giai[x.phong]?.noi_dung} <span className="text-fg-faint">{t("ks.thuc_te", { x: giai[x.phong]?.thuc_te ?? "" })}</span>
            </li>
          ))}
          {kq.dien_giai.dau_hieu.map((x) => (
            <li key={x.ma} className={cn("rounded-xl border px-4 py-2.5 text-sm", x.tot ? "border-jade/30 bg-jade/5" : x.veto ? "border-moon/40 bg-moon/[0.06]" : "border-line/70 bg-bg/30")} data-testid={`dau-hieu-${x.ma}`}>
              <b className="text-fg">{x.tieu_de}</b> <span className="text-xs text-fg-faint">({NGUON.has(x.nguon) ? t(`ks.nguon.${x.nguon}`) : x.nguon}{x.tu_mat_bang ? t("ks.suy_mat_bang") : ""})</span>
              {x.veto && <span className="ml-2 rounded-full border border-moon/50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-moon" data-testid="dau-hieu-veto">{t("ks.xu_ly_truoc")}</span>}
              : {x.noi_dung}
              {x.giai_thich && <span className="block text-xs text-fg-faint">{kq.goc_nhin === "doi_song" ? t("ks.sach_xua") : t("ks.doi_song")}: {kq.goc_nhin === "doi_song" ? x.giai_thich.sach_xua : x.giai_thich.doi_song}</span>}
              {x.viec?.length ? (
                <ul className="mt-1.5 space-y-0.5" data-testid="dau-hieu-viec">
                  {x.viec.map((v) => <li key={v.lam} className="flex gap-2"><span className="shrink-0 rounded-full border border-line px-2 text-[0.65rem] font-semibold uppercase tracking-wide text-fg-faint">{t(`ks.cp.${v.chi_phi}`)}</span><span className="text-fg-muted">{v.lam}</span></li>)}
                </ul>
              ) : <span className="text-fg-muted">{t("ks.goi_y", { x: x.goi_y })}</span>}
              {x.trang?.startsWith("/phong-thuy/") && <a href={duong(x.trang)} className="mt-1 inline-block text-xs text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold">{t("ks.doc_ky")}</a>}
            </li>
          ))}
          {kq.quy_tac?.map((q) => (
            <li key={q.ma} className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-2.5 text-sm" data-testid={`quy-tac-${q.ma}`}><b className="text-fg">{q.tieu_de}</b>: {q.noi_dung}</li>
          ))}
          {d.vi_tri.every((x) => x.hop !== false) && kq.dien_giai.dau_hieu.length === 0 && <li className="text-sm text-fg-muted">{t("ks.chua_thay")}</li>}
        </ul>
      </div>

      <SachXuaGhi khoi={kq.sach_ghi} moDun="phongthuy" tieuDe="Sách xưa ghi gì về ngôi nhà này"
        moTa="Câu trong sách Bát trạch xưa ứng với những điều nhà đang có và cách đặt cửa, phòng chính, bếp. Sách viết cho nhà thời đó; phần nào còn áp dụng được thì ghi rõ." />

      {kq.mat_bang && (
        <div data-testid="kq-mat-bang">
          <p className="eyebrow">{t("ks.mat_bang")}</p>
          <p className="mt-1 text-sm text-fg-muted">
            {kq.mat_bang.nguon === "so_do" || !kq.mat_bang.tam_o
              ? t("ks.mb_so_do")
              : t("ks.mb_tom_tat", { so: String(kq.mat_bang.so_o), r: String(kq.mat_bang.tam_o[0]! + 1), c: String(kq.mat_bang.tam_o[1]! + 1) })}{kq.mat_bang.tam_ngoai_nha ? t("ks.mb_ngoai") : ""}.
            {kq.mat_bang.khuyet_goc.length ? t("ks.mb_khuyet", { ds: kq.mat_bang.khuyet_goc.map((x) => huong(x)).join(", ") }) : t("ks.mb_khong_khuyet")}
            {kq.mat_bang.wc_trung_cung ? t("ks.mb_wc") : ""}
            {kq.mat_bang.cua_thong_ban_cong?.thang_hang ? t("ks.mb_ban_cong") : ""}
          </p>
          <div className="mt-2 grid w-fit grid-cols-3 gap-0.5" aria-label={t("ks.cuu_cung_aria")}>
            {kq.mat_bang.o_9.map((o) => (
              <div key={`${o.hang}${o.cot}`} className={cn("flex size-16 flex-col items-center justify-center rounded border text-[10px]", o.khuyet ? "border-moon/50 bg-moon/10 text-moon" : "border-line/60 bg-bg/30 text-fg-muted")}>
                <span>{o.phuong ? huong(o.phuong) : "—"}</span><span className="text-fg-faint">{Math.round(o.ti_le * 100)}%</span>
              </div>
            ))}
          </div>
          {kq.mat_bang.canh_bao.map((c) => <p key={c} className="mt-1 text-xs text-fg-faint">{c}</p>)}
          {(kq.mat_bang.dau_hieu_goi_y ?? []).filter((g) => !daTra.has(g.ma)).length > 0 && (
            <div className="mt-3 rounded-xl border border-gold/40 bg-gold/5 p-3 text-sm" data-testid="ks-so-do-goi-y">
              <p className="text-xs text-fg-muted">{t("ks.so_do_goi_y")}</p>
              <ul className="mt-1.5 space-y-1.5">
                {(kq.mat_bang.dau_hieu_goi_y ?? []).filter((g) => !daTra.has(g.ma)).map((g) => (
                  <li key={g.ma} className="flex flex-wrap items-center gap-2" data-testid={`ks-goi-y-${g.ma}`}>
                    <span className="text-fg">{g.hoi}</span>
                    <button type="button" className="min-h-[32px] rounded-full border border-gold/60 px-2.5 text-xs text-gold" onClick={() => onGoiY(g.ma, true)}>{t("ks.goi_y_co")}</button>
                    <button type="button" className="min-h-[32px] rounded-full border border-line px-2.5 text-xs text-fg-muted" onClick={() => onGoiY(g.ma, false)}>{t("ks.goi_y_khong")}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="eyebrow">{t("ks.tu_soi")}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-fg-muted">{kq.tu_soi.map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
      <p className="text-xs text-fg-faint">{kq.luu_y}</p>
    </div>
  );
}

/** TY-2 đợt 2: tóm tắt sơ đồ nhà đang dùng (từ "Đứng giữa nhà") + lối sang vẽ / sửa. Web không tính gì — chỉ đếm chỗ đã đặt. */
function SoDoTomTat({ soDo }: { soDo: ReturnType<typeof soDoGui> }) {
  const { c: t } = useChuPT();
  const cho = soDo ? Object.keys(soDo.vat) : [];
  return (
    <div className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm" data-testid="ks-so-do">
      <p className="flex items-center gap-2 font-medium text-fg"><Ruler className="size-4 text-gold" aria-hidden /> {t("ks.so_do_ten")}</p>
      <p className="mt-1 text-xs text-fg-muted">
        {soDo
          ? <ChuB chu={t("ks.so_do_co", { rong: String(soDo.rong), sau: String(soDo.sau), ds: cho.map((k) => t(`dv.ten.${k}`)).join(", ") })} lop="text-fg" />
          : <ChuB chu={t("ks.so_do_chua")} lop="text-fg" />}
      </p>
      <Link href="#vi-tri-vat" className="mt-2 inline-flex min-h-[36px] items-center text-xs text-gold underline-offset-2 hover:underline" data-testid="ks-so-do-mo">
        {soDo ? t("ks.so_do_sua") : t("ks.so_do_ve")}
      </Link>
    </div>
  );
}
