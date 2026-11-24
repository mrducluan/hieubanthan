"use client";
// VT-1 — "Đứng giữa nhà, chĩa điện thoại" (+ sơ đồ mặt bằng tỉ lệ tương tác Mini-CAD khi dùng máy tính), nhiều tầng.
// Web CHỈ đọc cảm biến / điểm chạm rồi gửi số thô (mẫu la bàn, toạ độ 0..1) lên engine `/api/phongthuy/vi-tri-vat`:
// engine lấy trung bình góc, trừ nhiễu theo trục nhà, đổi ra phương / sơn, xét Cửa – Chủ – Bếp từng tầng, du niên với mệnh,
// sao Huyền Không. Số đo & bố trí khung phòng chỉ lưu TRÊN MÁY (hồ sơ nhà) khi người dùng bấm Lưu.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Compass, Crosshair, Layers, Minus, Plus, RotateCw, Ruler, Trash2, Undo2, X } from "lucide-react";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { KetQuaTamYeu, SachTamYeu, type TamYeuRes } from "@/components/phong-thuy/TamYeuCuaChuBep";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha, type HuongCuaKhung, type LoaiVat } from "@/lib/ho-so-nha";
import {
  doLaBanCua,
  huongCuaMacDinh,
  kichThuocMacDinh,
  suyDauHieuTuKhung,
  tamNhaKhung,
  tinhHopPhong,
  xoayHuongCua,
  type HopPhongKhung,
} from "@/lib/mat-bang-khung";
import { tenTheo, type TenHien } from "@/lib/ten-hien";
import { cn } from "@/lib/utils";

type DoVat = {
  mau?: number[];
  diem?: [number, number];
  sai_so?: number;
  kich_thuoc?: [number, number];
  huong_cua?: HuongCuaKhung;
};
type TangDo = Partial<Record<LoaiVat, DoVat>>;

interface VatKq {
  loai: LoaiVat; ten: string; nguon: "la_ban" | "khung"; do: number; do_do: number; phuong: string; quai: string; son: string;
  sat_ranh_8: string | null; chua_on_dinh: boolean; canh_bao: string[];
  du_nien_menh?: { du_nien: string; cat: boolean }; sao?: { van: number; son: number; huong: number };
}
interface ViTriKq {
  lech: { do: number | null; ap_dung: boolean; nhieu_manh: boolean; loi: string };
  tang: { so: number; cua_tang: string; vat: VatKq[]; ghi_chu_cua?: string; chua_du?: string; tam_yeu?: TamYeuRes }[];
  luu_y_tham_khao: string;
  huyen_khong?: { van: number; cuc: string; cuc_ten?: string };
  ten_hien?: TenHien;
}

const VAT_TANG = (so: number): LoaiVat[] =>
  so === 1 ? ["cua_chinh", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho"] : ["cau_thang", "phong_ngu_chinh", "bep", "ve_sinh", "ban_tho"];
const THOI_GIAN_GHI = 1200;            // ms lấy mẫu mỗi lần ghi
const TOI_DA_MAU = 30;                 // giữ ≤ 30 mẫu / vật (đủ để engine lấy trung bình, hồ sơ máy nhẹ)
const LUOI_N = 4;                      // lưới bỏ phần không xây (nhà chữ L…)

/** Bảng màu ngữ nghĩa nhẹ cho từng loại phòng trên bản vẽ mặt bằng (nền tối). */
const MAU_PHONG: Record<LoaiVat, { fill: string; stroke: string; door: string }> = {
  cua_chinh: { fill: "rgba(234, 179, 8, 0.24)", stroke: "rgba(250, 204, 21, 0.95)", door: "#facc15" },
  phong_ngu_chinh: { fill: "rgba(99, 102, 241, 0.22)", stroke: "rgba(129, 140, 248, 0.9)", door: "#a5b4fc" },
  bep: { fill: "rgba(249, 115, 22, 0.22)", stroke: "rgba(251, 146, 60, 0.9)", door: "#fdba74" },
  ve_sinh: { fill: "rgba(20, 184, 166, 0.22)", stroke: "rgba(45, 212, 191, 0.9)", door: "#5eead4" },
  ban_tho: { fill: "rgba(192, 132, 252, 0.22)", stroke: "rgba(216, 180, 254, 0.9)", door: "#e9d5ff" },
  cau_thang: { fill: "rgba(148, 163, 184, 0.22)", stroke: "rgba(203, 213, 225, 0.9)", door: "#e2e8f0" },
};

type SuKien = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
type CoXinQuyen = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/** Độ la bàn của cạnh trên máy khi cầm nằm ngang (iOS cho sẵn; Android: 360 − alpha tuyệt đối). Chỉ đọc cảm biến. */
function docDo(e: SuKien, tuyetDoi: boolean): number | null {
  if (typeof e.webkitCompassHeading === "number") return e.webkitCompassHeading;
  if ((tuyetDoi || e.absolute) && typeof e.alpha === "number") return (360 - e.alpha) % 360;
  return null;
}
/** Độ rung của dãy mẫu gần nhất (chênh lớn nhất so với mẫu đầu, theo vòng) — chỉ để hiện chỉ báo, engine mới chấm. */
function doRung(ds: number[]): number {
  if (ds.length < 2) return 0;
  const goc = ds[0]!;
  return Math.max(...ds.map((d) => Math.abs(((d - goc + 540) % 360) - 180)));
}
const thuGon = (ds: number[]) => (ds.length <= TOI_DA_MAU ? ds : Array.from({ length: TOI_DA_MAU }, (_, i) => ds[Math.floor((i * ds.length) / TOI_DA_MAU)]!));

/** Vẽ ký hiệu kiến trúc cánh cửa + cung mở 90° trên cạnh tương ứng của hộp phòng. */
function KyHieuCua({ hop, mau, strokeW }: { hop: HopPhongKhung; mau: string; strokeW: number }) {
  const { x0, y0, w, h, cx, cy, huongCua } = hop;
  const banKinh = Math.min(0.85, Math.max(0.32, Math.min(w, h) * 0.42));
  // Bản lề (hx, hy), đầu cánh mở (lx, ly), đầu khung cửa đối diện (ex, ey), cung quét 90° từ đầu cánh về đầu khung.
  let hx = cx, hy = y0, lx = cx, ly = y0 - banKinh, ex = cx + banKinh, ey = y0;
  let sweep = 1;
  if (huongCua === "truoc") {
    hx = cx - banKinh / 2; hy = y0;
    ex = cx + banKinh / 2; ey = y0;
    lx = hx; ly = y0 - banKinh;
    sweep = 1;
  } else if (huongCua === "sau") {
    hx = cx + banKinh / 2; hy = y0 + h;
    ex = cx - banKinh / 2; ey = y0 + h;
    lx = hx; ly = y0 + h + banKinh;
    sweep = 1;
  } else if (huongCua === "phai") {
    hx = x0 + w; hy = cy - banKinh / 2;
    ex = x0 + w; ey = cy + banKinh / 2;
    lx = x0 + w + banKinh; ly = hy;
    sweep = 1;
  } else {
    hx = x0; hy = cy + banKinh / 2;
    ex = x0; ey = cy - banKinh / 2;
    lx = x0 - banKinh; ly = hy;
    sweep = 1;
  }
  return (
    <g pointerEvents="none">
      {/* Khoảng hở tường tại vị trí cửa */}
      <line x1={hx} y1={hy} x2={ex} y2={ey} stroke="rgb(var(--bg))" strokeWidth={strokeW * 2.2} strokeLinecap="butt" />
      {/* Cánh cửa mở 90° */}
      <line x1={hx} y1={hy} x2={lx} y2={ly} stroke={mau} strokeWidth={strokeW * 1.4} strokeLinecap="round" />
      {/* Cung mở cửa 90° */}
      <path d={`M ${lx} ${ly} A ${banKinh} ${banKinh} 0 0 ${sweep} ${ex} ${ey}`} fill="none" stroke={mau} strokeWidth={strokeW * 0.9} strokeDasharray={`${strokeW * 2} ${strokeW * 1.5}`} />
    </g>
  );
}

export function DoViTriVat({ sinh }: { sinh?: { birth_date: string; gender: "nam" | "nu"; moc_nam?: string } | null }) {
  const { c, en, huong: tenHuong } = useChuPT();
  const hoSo = useHoSoNha();
  const huongNha = hoSo?.huong_do ?? null;

  const [cheDo, setCheDo] = useState<"la_ban" | "khung">("la_ban");
  const [soTang, setSoTang] = useState(1);
  const [tang, setTang] = useState(1);
  const [doTang, setDoTang] = useState<Record<number, TangDo>>({});
  const [lichSu, setLichSu] = useState<Record<number, TangDo>[]>([]);
  const [truc, setTruc] = useState<number[] | null>(null);
  const [khung, setKhung] = useState<{ rong: number; sau: number; luoi: boolean[][] | null }>({ rong: 5, sau: 15, luoi: null });
  const [dangDat, setDangDat] = useState<LoaiVat>("cua_chinh");
  const [dangChon, setDangChon] = useState<LoaiVat | null>(null);
  const [boLuoi, setBoLuoi] = useState(false);
  const [hienCuuCung, setHienCuuCung] = useState(true);
  const [du18, setDu18] = useState(false);
  const [kq, setKq] = useState<ViTriKq | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTinh, setDangTinh] = useState(false);
  const [daLuu, setDaLuu] = useState(false);
  const daNap = useRef(false);

  // Kéo dời / kéo giãn phòng trên SVG
  const keoRef = useRef<
    | { loai: LoaiVat; kieu: "move"; dx: number; dy: number; daLuuUndo: boolean }
    | { loai: LoaiVat; kieu: "resize"; x0: number; y0: number; daLuuUndo: boolean }
    | null
  >(null);

  // la bàn
  const [bat, setBat] = useState(false);
  const [doSong, setDoSong] = useState<number | null>(null);
  const [nghieng, setNghieng] = useState(false);
  const [dangGhi, setDangGhi] = useState<LoaiVat | "truc" | null>(null);
  const mauSong = useRef<number[]>([]);
  const saiSo = useRef<number | undefined>(undefined);
  const gom = useRef<number[] | null>(null);
  const huy = useRef<(() => void) | null>(null);

  // Máy không la bàn / máy tính → mặc định khung tỉ lệ.
  useEffect(() => {
    try {
      const coCam = "DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches;
      if (!coCam) setCheDo("khung");
    } catch { setCheDo("khung"); }
  }, []);

  // Nạp số đo đã lưu (một lần).
  useEffect(() => {
    if (daNap.current || !hoSo) return;
    daNap.current = true;
    if (hoSo.tang_do?.length) {
      setDoTang(Object.fromEntries(hoSo.tang_do.map((t) => [t.so, t.vat as TangDo])));
      setSoTang(Math.max(...hoSo.tang_do.map((t) => t.so)));
    }
    if (hoSo.truc_mau) setTruc(hoSo.truc_mau);
    if (hoSo.khung) {
      setKhung({ rong: hoSo.khung.rong, sau: hoSo.khung.sau, luoi: hoSo.khung.luoi?.map((r) => [...r].map((x) => x === "1")) ?? null });
      if (hoSo.khung.luoi) setBoLuoi(true);
    }
  }, [hoSo]);

  useEffect(() => () => huy.current?.(), []);

  const dayUndo = useCallback((banCu: Record<number, TangDo>) => {
    setLichSu((s) => [...s.slice(-14), banCu]);
  }, []);

  const hoanTac = () => {
    setLichSu((s) => {
      if (!s.length) return s;
      const cuoi = s[s.length - 1]!;
      setDoTang(cuoi);
      setKq(null);
      setDaLuu(false);
      return s.slice(0, -1);
    });
  };

  const batLaBan = useCallback(async () => {
    setLoi(null);
    if (!("DeviceOrientationEvent" in window)) { setLoi(c("dv.khong_cam_bien")); setCheDo("khung"); return; }
    const DOE = window.DeviceOrientationEvent as CoXinQuyen;
    if (typeof DOE.requestPermission === "function") {
      try { if ((await DOE.requestPermission()) !== "granted") { setLoi(c("dv.quyen")); return; } } catch { setLoi(c("dv.quyen")); return; }
    }
    const tuyetDoi = "ondeviceorientationabsolute" in window;
    const ten = tuyetDoi ? "deviceorientationabsolute" : "deviceorientation";
    let nhan = false;
    const nghe = (ev: Event) => {
      const e = ev as SuKien;
      const d = docDo(e, tuyetDoi);
      if (d == null) return;
      nhan = true;
      setDoSong(d);
      setNghieng(typeof e.beta === "number" && Math.abs(e.beta) > 60);
      mauSong.current = [...mauSong.current.slice(-19), d];
      if (typeof e.webkitCompassAccuracy === "number") saiSo.current = e.webkitCompassAccuracy;
      gom.current?.push(d);
    };
    window.addEventListener(ten, nghe);
    huy.current = () => window.removeEventListener(ten, nghe);
    setBat(true);
    window.setTimeout(() => { if (!nhan) { setLoi(c("dv.khong_cam_bien")); setCheDo("khung"); } }, 2500);
  }, [c]);

  const ghiMau = (cho: LoaiVat | "truc") => {
    if (!bat || dangGhi) return;
    gom.current = [];
    setDangGhi(cho);
    window.setTimeout(() => {
      const ds = gom.current ?? [];
      gom.current = null;
      setDangGhi(null);
      if (!ds.length) return;
      const mau = thuGon(ds.map((d) => Math.round(d * 10) / 10));
      setKq(null); setDaLuu(false);
      if (cho === "truc") setTruc(mau);
      else setDoTang((cu) => {
        dayUndo(cu);
        return { ...cu, [tang]: { ...(cu[tang] ?? {}), [cho]: { mau, ...(saiSo.current != null ? { sai_so: saiSo.current } : {}) } } };
      });
      try { navigator.vibrate?.(30); } catch { /* không hỗ trợ */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_ghi", cho, cach: "la_ban" });
    }, THOI_GIAN_GHI);
  };

  const xoaVat = (l: LoaiVat) => {
    setKq(null); setDaLuu(false);
    setDoTang((cu) => {
      dayUndo(cu);
      const t = { ...(cu[tang] ?? {}) };
      delete t[l];
      return { ...cu, [tang]: t };
    });
    if (dangChon === l) setDangChon(null);
    setDangDat(l);
  };

  const xoaTangHienTai = () => {
    if (!Object.keys(doTang[tang] ?? {}).length) return;
    setKq(null); setDaLuu(false);
    setDoTang((cu) => {
      dayUndo(cu);
      return { ...cu, [tang]: {} };
    });
    setDangChon(null);
    setDangDat(VAT_TANG(tang)[0]!);
  };

  const capNhatVatKhung = (l: LoaiVat, sua: (cu: DoVat) => DoVat, coUndo = true) => {
    setKq(null); setDaLuu(false);
    setDoTang((cu) => {
      const vCu = cu[tang]?.[l];
      if (!vCu) return cu;
      if (coUndo) dayUndo(cu);
      return { ...cu, [tang]: { ...(cu[tang] ?? {}), [l]: sua(vCu) } };
    });
  };

  // ---- khung tỉ lệ Mini-CAD
  const svgRef = useRef<SVGSVGElement>(null);
  const toaDoSvg = (ev: React.PointerEvent<SVGElement>) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    return {
      mx: Math.min(khung.rong, Math.max(0, p.x)),
      my: Math.min(khung.sau, Math.max(0, p.y)),
      x: Math.min(1, Math.max(0, p.x / khung.rong)),
      y: Math.min(1, Math.max(0, p.y / khung.sau)),
    };
  };

  const datDiem = (ev: React.PointerEvent<SVGSVGElement>) => {
    const pt = toaDoSvg(ev);
    if (!pt) return;
    const { x, y } = pt;
    if (boLuoi) {
      const r = Math.min(LUOI_N - 1, Math.floor(y * LUOI_N)), col = Math.min(LUOI_N - 1, Math.floor(x * LUOI_N));
      setKhung((k) => {
        const l = k.luoi ?? Array.from({ length: LUOI_N }, () => Array(LUOI_N).fill(true));
        const moi = l.map((row, i) => row.map((v, j) => (i === r && j === col ? !v : v)));
        return { ...k, luoi: moi };
      });
      setKq(null);
      return;
    }
    const diem: [number, number] = [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000];
    setKq(null); setDaLuu(false);
    const vCu = doTang[tang]?.[dangDat];
    const kt = vCu?.kich_thuoc ?? kichThuocMacDinh(dangDat, khung.rong, khung.sau);
    const hc = vCu?.huong_cua ?? huongCuaMacDinh(dangDat, diem);
    setDoTang((cu) => {
      dayUndo(cu);
      return { ...cu, [tang]: { ...(cu[tang] ?? {}), [dangDat]: { ...vCu, diem, kich_thuoc: kt, huong_cua: hc } } };
    });
    setDangChon(dangDat);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_ghi", cho: dangDat, cach: "khung" });
    const ds = VAT_TANG(tang);
    const tiep = ds[ds.indexOf(dangDat) + 1];
    if (tiep && !doTang[tang]?.[tiep]) setDangDat(tiep);
  };

  const batDauKeo = (ev: React.PointerEvent<SVGGElement>, loai: LoaiVat, hop: HopPhongKhung) => {
    // Nếu đang ở chế độ bỏ ô chữ L hoặc đang cầm 1 vật CHƯA ĐẶT trên sàn → để sự kiện nổi lên SVG đặt vật mới ngay tại chỗ chạm.
    if (boLuoi || !doHienTai[dangDat]?.diem) return;
    ev.stopPropagation();
    const pt = toaDoSvg(ev);
    if (!pt) return;
    setDangChon(loai);
    setDangDat(loai);
    keoRef.current = { loai, kieu: "move", dx: pt.mx - hop.cx, dy: pt.my - hop.cy, daLuuUndo: false };
    try { svgRef.current?.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
  };

  const batDauResize = (ev: React.PointerEvent<SVGRectElement>, loai: LoaiVat, hop: HopPhongKhung) => {
    if (boLuoi) return;
    ev.stopPropagation();
    setDangChon(loai);
    setDangDat(loai);
    keoRef.current = { loai, kieu: "resize", x0: hop.x0, y0: hop.y0, daLuuUndo: false };
    try { svgRef.current?.setPointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
  };

  const diChuyenKeo = (ev: React.PointerEvent<SVGSVGElement>) => {
    const k = keoRef.current;
    if (!k) return;
    const pt = toaDoSvg(ev);
    if (!pt) return;
    if (k.kieu === "move") {
      const nx = Math.min(1, Math.max(0, (pt.mx - k.dx) / khung.rong));
      const ny = Math.min(1, Math.max(0, (pt.my - k.dy) / khung.sau));
      const diem: [number, number] = [Math.round(nx * 1000) / 1000, Math.round(ny * 1000) / 1000];
      capNhatVatKhung(k.loai, (v) => ({ ...v, diem }), !k.daLuuUndo);
      k.daLuuUndo = true;
    } else {
      const nw = Math.round(Math.min(khung.rong, Math.max(0.6, pt.mx - k.x0)) * 10) / 10;
      const nh = Math.round(Math.min(khung.sau, Math.max(0.5, pt.my - k.y0)) * 10) / 10;
      const nx = Math.min(1, Math.max(0, (k.x0 + nw / 2) / khung.rong));
      const ny = Math.min(1, Math.max(0, (k.y0 + nh / 2) / khung.sau));
      capNhatVatKhung(
        k.loai,
        (v) => ({ ...v, kich_thuoc: [nw, nh], diem: [Math.round(nx * 1000) / 1000, Math.round(ny * 1000) / 1000] }),
        !k.daLuuUndo,
      );
      k.daLuuUndo = true;
    }
  };

  const ketThucKeo = (ev: React.PointerEvent<SVGSVGElement>) => {
    if (!keoRef.current) return;
    keoRef.current = null;
    try { svgRef.current?.releasePointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
  };

  const luoiGui = useMemo(() => {
    if (!khung.luoi || khung.luoi.every((r) => r.every(Boolean))) return undefined;
    return khung.luoi.map((r) => r.map((v) => (v ? "1" : "0")).join(""));
  }, [khung.luoi]);

  const coGi = Object.values(doTang).some((t) => Object.keys(t).length > 0);
  const doHienTai = doTang[tang] ?? {};

  const hopCacPhong = useMemo(() => {
    return (Object.entries(doHienTai) as [LoaiVat, DoVat][])
      .filter(([, v]) => v.diem)
      .map(([loai, v]) => ({
        loai,
        hop: tinhHopPhong(loai, v.diem!, khung.rong, khung.sau, v.kich_thuoc, v.huong_cua),
      }));
  }, [doHienTai, khung.rong, khung.sau]);

  const dauHieuPhatHien = useMemo(
    () => (cheDo === "khung" ? suyDauHieuTuKhung(doHienTai, khung.rong, khung.sau, khung.luoi) : []),
    [cheDo, doHienTai, khung.rong, khung.sau, khung.luoi],
  );

  const tamNha = useMemo(() => tamNhaKhung(khung.luoi), [khung.luoi]);

  const xem = async () => {
    setDangTinh(true); setLoi(null);
    const tangGui = Object.entries(doTang)
      .map(([so, t]) => ({
        so: Number(so),
        vat: (Object.entries(t) as [LoaiVat, DoVat][]).filter(([, v]) => v.mau || v.diem)
          .map(([loai, v]) => (v.diem ? { loai, diem: v.diem } : { loai, mau: v.mau!, ...(v.sai_so != null ? { sai_so: v.sai_so } : {}) })),
      }))
      .filter((t) => t.vat.length && t.so <= soTang);
    const coDiem = tangGui.some((t) => t.vat.some((v) => "diem" in v));
    try {
      const r = await postJson<ViTriKq>("/api/phongthuy/vi-tri-vat", {
        tang: tangGui,
        ...(huongNha != null ? { huong_nha_do: huongNha } : {}),
        ...(truc ? { truc_mau: truc } : {}),
        ...(coDiem ? { khung: { rong: khung.rong, sau: khung.sau, ...(luoiGui ? { luoi: luoiGui } : {}) } } : {}),
        ...(hoSo?.nam_xay ? { nam_xay: hoSo.nam_xay } : {}),
        ...(sinh ? { sinh } : {}),
        ...(du18 ? { du_18: true } : {}),
      });
      setKq(r);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_xem", so_tang: tangGui.length, co_truc: Boolean(truc), cach: coDiem ? "khung" : "la_ban" });
    } catch { setLoi(c("dv.loi")); }
    finally { setDangTinh(false); }
  };

  // du18 đổi → tính lại để hiện / ẩn nhóm C
  useEffect(() => { if (kq) void xem(); }, [du18]); // eslint-disable-line react-hooks/exhaustive-deps

  const luu = () => {
    const t1 = kq?.tang.find((t) => t.so === 1);
    const viTri: Record<string, string> = {};
    for (const v of t1?.vat ?? []) if (v.loai !== "cau_thang") viTri[v.loai] = v.phuong;
    const daXuLy = new Set([...(hoSo?.bo_cuc?.da_xu_ly ?? []), ...(hoSo?.bo_cuc?.khai_khong ?? [])]);
    const dauHieuMoi = [...new Set([...(hoSo?.bo_cuc?.dau_hieu ?? []), ...dauHieuPhatHien.filter((m) => !daXuLy.has(m))])];
    try {
      luuHoSoNha({
        tang_do: Object.entries(doTang).filter(([so, t]) => Number(so) <= soTang && Object.keys(t).length)
          .map(([so, t]) => ({ so: Number(so), vat: t })),
        ...(truc ? { truc_mau: truc } : {}),
        khung: { rong: khung.rong, sau: khung.sau, ...(luoiGui ? { luoi: luoiGui } : {}) },
        ...(Object.keys(viTri).length || dauHieuMoi.length
          ? {
              bo_cuc: {
                ...(hoSo?.bo_cuc ?? {}),
                ...(Object.keys(viTri).length ? { vi_tri: { ...(hoSo?.bo_cuc?.vi_tri ?? {}), ...viTri } } : {}),
                ...(dauHieuMoi.length ? { dau_hieu: dauHieuMoi } : {}),
              },
            }
          : {}),
      });
      setDaLuu(true);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "vi_tri_luu" });
    } catch { /* chế độ riêng tư */ }
  };

  const tenKq = tenTheo(kq?.ten_hien, en);
  const vatTang = VAT_TANG(tang);
  const rung = doRung(mauSong.current);
  const mucRung = rung <= 3 ? "on_dinh" : rung <= 8 ? "hoi_rung" : "nhieu";

  const chonHienTai = dangChon && doHienTai[dangChon]?.diem ? dangChon : null;
  const hopChon = chonHienTai ? hopCacPhong.find((x) => x.loai === chonHienTai)?.hop ?? null : null;
  const huongCuaLaBan = hopChon ? doLaBanCua(hopChon.huongCua, huongNha) : null;
  const donViSvg = Math.max(khung.rong, khung.sau);
  const strokeCoBan = donViSvg / 180;

  return (
    <section id="vi-tri-vat" aria-labelledby="vi-tri-vat-ten" data-testid="vi-tri-vat" className="glass rounded-2xl p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wider text-gold">{c("dv.nhan")}</p>
      <h2 id="vi-tri-vat-ten" className="mt-1 font-serif text-xl text-fg sm:text-2xl">{c("dv.ten")}</h2>
      <p className="mt-1 text-sm text-fg-muted"><ChuB chu={c("dv.mo_ta")} /></p>

      <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={c("dv.ten")}>
        {([["la_ban", c("dv.cach_la_ban"), Compass], ["khung", c("dv.cach_khung"), Ruler]] as const).map(([m, nhan, Icon]) => (
          <button key={m} type="button" role="radio" aria-checked={cheDo === m} data-testid={`vi-tri-cach-${m}`} onClick={() => setCheDo(m)}
            className={cn("inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
              cheDo === m ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
            <Icon className="size-3.5 text-gold" aria-hidden /> {nhan}
          </button>
        ))}
      </div>

      {/* Tầng */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs" role="tablist" aria-label={c("dv.tang_ghi_chu")}>
        <Layers className="size-3.5 text-gold" aria-hidden />
        {Array.from({ length: soTang }, (_, i) => i + 1).map((so) => (
          <button key={so} type="button" role="tab" aria-selected={tang === so} data-testid={`vi-tri-tang-${so}`}
            onClick={() => { setTang(so); setDangDat(VAT_TANG(so)[0]!); setDangChon(null); }}
            className={cn("min-h-[36px] rounded-full border px-3 py-1", tang === so ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
            {c("dv.tang", { so: String(so) })}
          </button>
        ))}
        {soTang < 6 && (
          <button type="button" data-testid="vi-tri-them-tang" onClick={() => { setSoTang(soTang + 1); setTang(soTang + 1); setDangDat("cau_thang"); setDangChon(null); }}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-dashed border-line px-3 py-1 text-fg-muted hover:text-fg">
            <Plus className="size-3.5" aria-hidden /> {c("dv.them_tang")}
          </button>
        )}
        {soTang > 1 && <span className="text-fg-faint">{c("dv.tang_ghi_chu")}</span>}
      </div>

      {cheDo === "la_ban" ? (
        <div className="mt-4 space-y-3">
          {!bat ? (
            <button type="button" data-testid="vi-tri-bat" onClick={() => void batLaBan()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25">
              <Compass className="size-4" aria-hidden /> {c("dv.bat")}
            </button>
          ) : (
            <div className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm" aria-live="polite">
              <p className="text-fg">{c("dv.dang_chi", { do: doSong == null ? "—" : String(Math.round(doSong)) })}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs">
                <span className="cham-muc size-2 rounded-full" data-muc={mucRung === "on_dinh" ? "thuan" : mucRung === "hoi_rung" ? "can_bang" : "can_chu_dong"} />
                {c(`dv.${mucRung}`)}
              </p>
              {nghieng && <p className="mt-1 text-xs text-fg-muted">{c("dv.dung_nghieng")}</p>}
            </div>
          )}
          <p className="text-xs text-fg-muted">{c("dv.cam_may")}</p>

          {tang === 1 && (
            <div className="rounded-xl border border-line/70 bg-surface/30 p-3 text-sm">
              <p className="font-medium text-fg">{c("dv.truc")}</p>
              <p className="mt-0.5 text-xs text-fg-muted">{c("dv.truc_hd")}</p>
              <button type="button" disabled={!bat || Boolean(dangGhi)} onClick={() => ghiMau("truc")} data-testid="vi-tri-ghi-truc"
                className="mt-2 inline-flex min-h-[40px] items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-fg disabled:opacity-50">
                {dangGhi === "truc" ? c("dv.dang_ghi") : truc ? <><Check className="size-3.5 text-jade" aria-hidden /> {c("dv.da_truc")}</> : c("dv.ghi_truc")}
              </button>
            </div>
          )}

          <p className="text-sm text-fg">{c("dv.vat_hd")}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {vatTang.map((l) => {
              const v = doHienTai[l];
              return (
                <li key={l} className="flex items-center justify-between gap-2 rounded-xl border border-line/70 bg-surface/40 p-2.5">
                  <button type="button" disabled={!bat || Boolean(dangGhi)} onClick={() => ghiMau(l)} data-testid={`vi-tri-ghi-${l}`}
                    className="min-h-[40px] flex-1 rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-left text-sm text-fg disabled:opacity-50">
                    {dangGhi === l ? c("dv.dang_ghi") : v?.mau ? c("dv.da_ghi", { vat: c(`dv.ten.${l}`), do: String(Math.round(v.mau[0]!)) }) : c("dv.ghi", { vat: c(`dv.ten.${l}`) })}
                  </button>
                  {v && <button type="button" onClick={() => xoaVat(l)} aria-label={`${c("dv.xoa")} ${c(`dv.ten.${l}`)}`} className="p-2 text-fg-faint hover:text-fg"><Trash2 className="size-4" aria-hidden /></button>}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {huongNha == null && <p className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm text-fg-muted" data-testid="vi-tri-can-huong">{c("dv.can_huong")}</p>}
          <p className="text-xs text-fg-muted">{c("dv.khung_hd")}</p>

          {/* Thanh kích thước & tùy chọn mặt bằng */}
          <div className="flex flex-wrap items-end gap-3 text-sm">
            {(["rong", "sau"] as const).map((k) => (
              <label key={k} className="flex flex-col gap-1 text-xs text-fg-muted">
                {c(`dv.${k}`)}
                <input type="number" min={1} max={200} step={0.5} value={khung[k]} data-testid={`vi-tri-${k}`}
                  onChange={(e) => { const n = Number(e.target.value); if (n > 0 && n <= 200) { setKhung((x) => ({ ...x, [k]: n })); setKq(null); } }}
                  className="w-24 rounded-lg border border-line bg-bg/40 px-2 py-1.5 text-sm text-fg" />
              </label>
            ))}
            <label className="inline-flex min-h-[36px] items-center gap-2 text-xs text-fg">
              <input type="checkbox" checked={boLuoi} onChange={(e) => setBoLuoi(e.target.checked)} data-testid="vi-tri-bo-luoi" />
              {c("dv.khong_vuong")}
            </label>
            <button type="button" aria-pressed={hienCuuCung} data-testid="vi-tri-luoi-cuu-cung" onClick={() => setHienCuuCung((x) => !x)}
              className={cn("inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                hienCuuCung ? "border-gold/60 bg-gold/10 text-gold" : "border-line text-fg-muted hover:text-fg")}>
              <Crosshair className="size-3.5" aria-hidden /> {c("dv.luoi_cuu_cung")}
            </button>
          </div>

          {/* Thanh chọn phòng + nút Xoá nhanh từng phòng + Hoàn tác / Xoá tầng */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-fg-muted">{c("dv.dang_dat")}</span>
              {vatTang.map((l) => {
                const daDat = Boolean(doHienTai[l]?.diem);
                const dangActive = dangDat === l && !boLuoi;
                return (
                  <span key={l} className={cn(
                    "inline-flex min-h-[36px] items-center rounded-full border transition-colors",
                    dangActive ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg",
                    daDat && "font-medium",
                  )}>
                    <button type="button" aria-pressed={dangActive} data-testid={`vi-tri-dat-${l}`}
                      onClick={() => { setDangDat(l); setBoLuoi(false); if (daDat) setDangChon(l); }}
                      className="inline-flex min-h-[34px] items-center gap-1.5 px-2.5 py-1">
                      <span className="size-2 rounded-sm" style={{ backgroundColor: MAU_PHONG[l].stroke }} aria-hidden />
                      {c(`dv.ten.${l}`)}{daDat ? " ✓" : ""}
                    </button>
                    {daDat && (
                      <button type="button" data-testid={`vi-tri-xoa-chip-${l}`} onClick={() => xoaVat(l)}
                        aria-label={`${c("dv.xoa")} ${c(`dv.ten.${l}`)}`}
                        className="mr-1 inline-flex size-6 items-center justify-center rounded-full text-fg-faint hover:bg-surface/80 hover:text-fg">
                        <X className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={!lichSu.length} onClick={hoanTac} data-testid="vi-tri-hoan-tac"
                className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-fg-muted hover:text-fg disabled:opacity-40">
                <Undo2 className="size-3.5" aria-hidden /> {c("dv.hoan_tac")}
              </button>
              <button type="button" disabled={!Object.keys(doHienTai).length} onClick={xoaTangHienTai} data-testid="vi-tri-xoa-tang"
                className="inline-flex min-h-[34px] items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-fg-muted hover:text-fg disabled:opacity-40">
                <Trash2 className="size-3.5" aria-hidden /> {c("dv.xoa_tang")}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-fg-faint">{c("dv.meo_keo")}</p>

          {/* Bản vẽ mặt bằng tỉ lệ tương tác (Mini-CAD Blueprint) */}
          <div className="mx-auto w-full max-w-lg rounded-2xl border border-line/60 bg-bg/50 p-3 sm:p-4">
            <p className="mb-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-gold">
              ▲ {c("dv.mat_truoc")}{huongNha != null ? ` · ${Math.round(huongNha)}°` : ""} · {khung.rong}m × {khung.sau}m
            </p>
            <svg ref={svgRef} viewBox={`0 0 ${khung.rong} ${khung.sau}`} preserveAspectRatio="xMidYMid meet" data-testid="vi-tri-khung"
              className="mx-auto block touch-none select-none overflow-visible"
              style={{ aspectRatio: `${khung.rong} / ${khung.sau}`, width: `min(100%, calc(62vh * ${khung.rong / khung.sau}))` }}
              onPointerDown={datDiem}
              onPointerMove={diChuyenKeo}
              onPointerUp={ketThucKeo}
              onPointerCancel={ketThucKeo}
              role="group" aria-label={c("dv.khung_hd")}>
              <defs>
                <pattern id="luoi-1m" width="1" height="1" patternUnits="userSpaceOnUse">
                  <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgb(var(--line) / 0.25)" strokeWidth={strokeCoBan * 0.45} />
                </pattern>
              </defs>

              {/* Nền mặt bằng & lưới 1m */}
              <rect x={0} y={0} width={khung.rong} height={khung.sau} fill="rgb(var(--surface) / 0.55)" />
              <rect x={0} y={0} width={khung.rong} height={khung.sau} fill="url(#luoi-1m)" pointerEvents="none" />

              {/* Các ô khuyết (nhà chữ L) */}
              {khung.luoi && khung.luoi.map((row, i) => row.map((v, j) => !v ? (
                <rect key={`${i}-${j}`} x={(j * khung.rong) / LUOI_N} y={(i * khung.sau) / LUOI_N} width={khung.rong / LUOI_N} height={khung.sau / LUOI_N}
                  fill="rgb(var(--bg))" stroke="rgb(var(--line) / 0.5)" strokeWidth={strokeCoBan * 0.6} />
              ) : null))}

              {/* Lưới 4×4 khi đang bỏ phần không xây */}
              {boLuoi && Array.from({ length: LUOI_N - 1 }, (_, i) => i + 1).map((i) => (
                <g key={i} stroke="rgb(var(--gold) / 0.45)" strokeWidth={strokeCoBan * 0.7} strokeDasharray={`${strokeCoBan * 3} ${strokeCoBan * 2}`} pointerEvents="none">
                  <line x1={(i * khung.rong) / LUOI_N} y1={0} x2={(i * khung.rong) / LUOI_N} y2={khung.sau} />
                  <line x1={0} y1={(i * khung.sau) / LUOI_N} x2={khung.rong} y2={(i * khung.sau) / LUOI_N} />
                </g>
              ))}

              {/* Lớp Tâm nhà & 8 phương / Trung cung */}
              {hienCuuCung && (
                <g pointerEvents="none" opacity={0.65}>
                  {/* Vùng 1/3 Trung cung */}
                  <rect x={khung.rong / 3} y={khung.sau / 3} width={khung.rong / 3} height={khung.sau / 3}
                    fill="rgb(var(--gold) / 0.04)" stroke="rgb(var(--gold) / 0.3)" strokeWidth={strokeCoBan * 0.55} strokeDasharray={`${strokeCoBan * 2.5} ${strokeCoBan * 2.5}`} />
                  {/* 8 tia chia 8 phương từ Tâm nhà */}
                  {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const tx = tamNha[0] * khung.rong, ty = tamNha[1] * khung.sau;
                    const R = donViSvg * 1.1;
                    return (
                      <line key={deg} x1={tx} y1={ty} x2={tx + Math.sin(rad) * R} y2={ty - Math.cos(rad) * R}
                        stroke="rgb(var(--gold) / 0.18)" strokeWidth={strokeCoBan * 0.45} clipPath="url(#bien-nha)" />
                    );
                  })}
                  <clipPath id="bien-nha"><rect x={0} y={0} width={khung.rong} height={khung.sau} /></clipPath>
                  {/* Tâm nhà */}
                  <circle cx={tamNha[0] * khung.rong} cy={tamNha[1] * khung.sau} r={strokeCoBan * 2.2} fill="none" stroke="rgb(var(--gold) / 0.75)" strokeWidth={strokeCoBan * 0.7} />
                  <circle cx={tamNha[0] * khung.rong} cy={tamNha[1] * khung.sau} r={strokeCoBan * 0.7} fill="rgb(var(--gold))" />
                </g>
              )}

              {/* Đường bao tường nhà */}
              <rect x={0} y={0} width={khung.rong} height={khung.sau} fill="none" stroke="rgb(var(--gold) / 0.75)" strokeWidth={strokeCoBan * 1.2} pointerEvents="none" />

              {/* Các hộp phòng / vật dụng + ký hiệu mở cửa + tay kéo chỉnh kích thước */}
              {hopCacPhong.map(({ loai, hop }) => {
                const mau = MAU_PHONG[loai];
                const isSelected = chonHienTai === loai;
                const fontSize = Math.max(0.28, Math.min(0.62, Math.min(hop.w * 0.24, hop.h * 0.32, donViSvg / 24)));
                const handleSize = Math.max(0.26, Math.min(0.5, donViSvg / 32));
                const nhanNgan = c(`dv.tat.${loai}`);
                const hienKt = hop.h >= fontSize * 2.6 && hop.w >= fontSize * 3.2;
                return (
                  <g key={loai} data-testid={`vi-tri-hop-${loai}`}
                    className={cn(!boLuoi && "cursor-grab active:cursor-grabbing")}
                    onPointerDown={(e) => batDauKeo(e, loai, hop)}>
                    {/* Khung phòng */}
                    <rect x={hop.x0} y={hop.y0} width={hop.w} height={hop.h} rx={strokeCoBan * 1.5}
                      fill={mau.fill}
                      stroke={isSelected ? "#facc15" : mau.stroke}
                      strokeWidth={isSelected ? strokeCoBan * 1.6 : strokeCoBan * 0.95} />
                    {/* Ký hiệu cửa & cung mở cửa 90° */}
                    <KyHieuCua hop={hop} mau={mau.door} strokeW={strokeCoBan} />
                    {/* Tên phòng & kích thước căn giữa gọn trong hộp (không đè chữ) */}
                    <text x={hop.cx} y={hienKt ? hop.cy - fontSize * 0.25 : hop.cy + fontSize * 0.34}
                      textAnchor="middle" fontSize={fontSize} fontWeight={600}
                      fill="rgb(var(--fg))" pointerEvents="none"
                      style={{ paintOrder: "stroke", stroke: "rgb(var(--bg) / 0.85)", strokeWidth: fontSize * 0.22 }}>
                      {nhanNgan}
                    </text>
                    {hienKt && (
                      <text x={hop.cx} y={hop.cy + fontSize * 0.95}
                        textAnchor="middle" fontSize={fontSize * 0.68}
                        fill="rgb(var(--fg-muted))" pointerEvents="none">
                        {hop.w}×{hop.h}m
                      </text>
                    )}
                    {/* Tay nắm kéo chỉnh kích thước ở góc phải-dưới khi đang chọn */}
                    {isSelected && !boLuoi && (
                      <rect
                        x={hop.x0 + hop.w - handleSize / 2}
                        y={hop.y0 + hop.h - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        rx={handleSize * 0.2}
                        fill="#facc15"
                        stroke="rgb(var(--bg))"
                        strokeWidth={strokeCoBan * 0.6}
                        className="cursor-nwse-resize"
                        data-testid={`vi-tri-resize-${loai}`}
                        onPointerDown={(e) => batDauResize(e, loai, hop)}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Thanh điều chỉnh phòng đang chọn: Xoay hướng cửa, Chỉnh Rộng × Sâu, Xoá */}
          {chonHienTai && hopChon && (
            <div data-testid="vi-tri-chinh-phong" className="rounded-xl border border-gold/40 bg-surface/60 p-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: MAU_PHONG[chonHienTai].stroke }} aria-hidden />
                  <span className="font-medium text-fg">{c(`dv.ten.${chonHienTai}`)}</span>
                  <span className="rounded-full border border-line bg-bg/50 px-2 py-0.5 text-fg-muted" data-testid="vi-tri-huong-cua-nhan">
                    {c("dv.cua_mo", { huong: c(`dv.cua_huong.${hopChon.huongCua}`) })}
                    {huongCuaLaBan?.do != null && huongCuaLaBan.phuong ? ` · ${huongCuaLaBan.do}° (${tenHuong(huongCuaLaBan.phuong)})` : ""}
                  </span>
                </div>
                <button type="button" data-testid="vi-tri-xoa-chon" onClick={() => xoaVat(chonHienTai)}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-line px-2.5 py-1 text-fg-muted hover:border-red-400/60 hover:text-fg">
                  <Trash2 className="size-3.5" aria-hidden /> {c("dv.xoa")}
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                <button type="button" data-testid="vi-tri-xoay-cua"
                  onClick={() => capNhatVatKhung(chonHienTai, (v) => ({ ...v, huong_cua: xoayHuongCua(hopChon.huongCua) }))}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-medium text-gold hover:bg-gold/25">
                  <RotateCw className="size-3.5" aria-hidden /> {c("dv.xoay_cua")}
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-fg-muted">{c("dv.kich_thuoc_phong")}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg/40 px-1.5 py-0.5">
                    <button type="button" aria-label={`− ${c("dv.rong")}`} data-testid="vi-tri-phong-rong-giam"
                      onClick={() => capNhatVatKhung(chonHienTai, (v) => ({ ...v, kich_thuoc: [Math.max(0.5, Math.round((hopChon.w - 0.5) * 10) / 10), hopChon.h] }))}
                      className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface"><Minus className="size-3" /></button>
                    <span className="min-w-[3.2rem] text-center font-medium text-fg" data-testid="vi-tri-phong-rong">{hopChon.w}m</span>
                    <button type="button" aria-label={`+ ${c("dv.rong")}`} data-testid="vi-tri-phong-rong-tang"
                      onClick={() => capNhatVatKhung(chonHienTai, (v) => ({ ...v, kich_thuoc: [Math.min(khung.rong, Math.round((hopChon.w + 0.5) * 10) / 10), hopChon.h] }))}
                      className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface"><Plus className="size-3" /></button>
                  </span>
                  <span className="text-fg-faint">×</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg/40 px-1.5 py-0.5">
                    <button type="button" aria-label={`− ${c("dv.sau")}`} data-testid="vi-tri-phong-sau-giam"
                      onClick={() => capNhatVatKhung(chonHienTai, (v) => ({ ...v, kich_thuoc: [hopChon.w, Math.max(0.5, Math.round((hopChon.h - 0.5) * 10) / 10)] }))}
                      className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface"><Minus className="size-3" /></button>
                    <span className="min-w-[3.2rem] text-center font-medium text-fg" data-testid="vi-tri-phong-sau">{hopChon.h}m</span>
                    <button type="button" aria-label={`+ ${c("dv.sau")}`} data-testid="vi-tri-phong-sau-tang"
                      onClick={() => capNhatVatKhung(chonHienTai, (v) => ({ ...v, kich_thuoc: [hopChon.w, Math.min(khung.sau, Math.round((hopChon.h + 0.5) * 10) / 10)] }))}
                      className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface"><Plus className="size-3" /></button>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cảnh báo tự động suy ra từ sơ đồ khung phòng & hướng cửa */}
          {dauHieuPhatHien.length > 0 && (
            <div data-testid="vi-tri-phat-hien" className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs">
              <p className="flex items-center gap-1.5 font-medium text-gold">
                <AlertTriangle className="size-3.5" aria-hidden /> {c("dv.phat_hien")}
              </p>
              <ul className="mt-1.5 space-y-1 text-fg-muted">
                {dauHieuPhatHien.map((ma) => (
                  <li key={ma}>• {c(`dv.dh.${ma}`)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {loi && <p className="mt-3 text-sm text-fg-muted">{loi}</p>}

      <div className="mt-4">
        <button type="button" disabled={!coGi || dangTinh} onClick={() => void xem()} data-testid="vi-tri-xem"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/25 disabled:opacity-50">
          {dangTinh ? c("dv.dang_tinh") : c("dv.xem")}
        </button>
      </div>

      {kq && (
        <div className="mt-5 space-y-5" aria-live="polite" data-testid="vi-tri-ket-qua">
          <p className="text-xs text-fg-muted">{kq.lech.loi}</p>
          {kq.tang.map((t) => (
            <div key={t.so} className="space-y-3" data-testid={`vi-tri-kq-tang-${t.so}`}>
              <h3 className="text-base font-medium text-fg">{c("dv.tang", { so: String(t.so) })}</h3>
              {t.ghi_chu_cua && <p className="text-xs text-fg-faint">{t.ghi_chu_cua}</p>}
              <ul className="grid gap-2 sm:grid-cols-2">
                {t.vat.map((v) => (
                  <li key={v.loai} className="rounded-xl border border-line/70 bg-surface/40 p-3 text-sm" data-testid={`vi-tri-vat-${v.loai}`}>
                    <p className="font-medium text-fg">{v.ten} · {c("dv.phia", { huong: tenKq("huong", v.phuong) })}</p>
                    <p className="text-xs text-fg-muted">{Math.round(v.do)}° · {c("dv.son", { son: tenKq("son", v.son) })}</p>
                    {v.du_nien_menh && (
                      <p className="mt-1 text-xs"><span className="chip-muc rounded-full border px-2 py-0.5" data-muc={v.du_nien_menh.cat ? "thuan" : "can_chu_dong"}>
                        {c("dv.voi_menh", { du_nien: tenKq("du_nien", v.du_nien_menh.du_nien) })}</span></p>
                    )}
                    {v.sao && <p className="mt-1 text-xs text-fg-muted">{c("dv.sao", { van: String(v.sao.van), son: String(v.sao.son), huong: String(v.sao.huong) })}</p>}
                    {v.canh_bao.map((x, i) => <p key={i} className="mt-1 text-xs text-fg-muted">{x}</p>)}
                  </li>
                ))}
              </ul>
              {t.tam_yeu ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-fg">{c("dv.ket_qua_tang", { so: String(t.so) })}</p>
                  <KetQuaTamYeu kq={t.tam_yeu} />
                </div>
              ) : t.chua_du ? <p className="text-xs text-fg-faint">{t.chua_du}</p> : null}
            </div>
          ))}
          {kq.tang.find((t) => t.tam_yeu)?.tam_yeu ? (
            <SachTamYeu kq={kq.tang.find((t) => t.tam_yeu)!.tam_yeu!} coNamSinh={Boolean(sinh)} du18={du18} onDu18={setDu18} />
          ) : <p className="text-[11px] leading-relaxed text-fg-faint">{kq.luu_y_tham_khao}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={luu} data-testid="vi-tri-luu"
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 font-medium text-gold hover:bg-gold/25">
              {daLuu ? <><Check className="size-3.5" aria-hidden /> {c("dv.da_luu")}</> : c("dv.luu")}
            </button>
            <span className="text-fg-faint">{c("dv.luu_ghi_chu")}</span>
          </div>
        </div>
      )}
    </section>
  );
}
