"use client";
// PT-ĐS — "Nhà của bạn": báo cáo đời thường 5 chương (Bạn hợp hướng nào · Ngôi nhà này với bạn · Từng phòng · Năm nay và
// 3 tháng tới · Việc nên làm). Người dùng chỉ nhập hướng cửa (hoặc ban công), năm xây, người cùng ở; engine dựng mọi chữ.
// Tầng đời thường hiện ngay (mức, hộp nổi bật, việc nên làm); tầng học thuật (du niên, phi tinh, cặp sao) gập trong
// "Vì sao nói vậy". Không lưu gì; thành viên chỉ gửi năm sinh + giới tính.
import { useEffect, useRef, useState } from "react";
import { Home, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import { HopNoiBat, KiemChungBai, ViSao } from "@/components/luan-giai/HopNoiBat";
import { useTyLe } from "@/lib/ty-le-kiem-chung";
import { PHAI_DOI_SONG } from "@/lib/kiem-chung";
import type { Hop, Muc } from "@/components/luan-giai/kieu";
import type { MocNam } from "@/components/huyen-hoc/KhungPhai";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { luuHoSoNha, useHoSoNha } from "@/lib/ho-so-nha";
import { LuuNhaTaiKhoan } from "@/components/huyen-hoc/LuuNhaTaiKhoan";
import { cn } from "@/lib/utils";
import { GoiMoCheo, type GoiMo } from "@/components/khung/GoiMoCheo";
import { NhacToi } from "@/components/khung/NhacToi";
import { datGocNhin, TEN_GOC_NHIN, useGocNhin, type GocNhin } from "@/lib/goc-nhin-pt";
import { SoDoNha } from "@/components/huyen-hoc/SoDoNha";
import { NHAN_MUC } from "@/components/luan-giai/kieu";
import { boCucGui, type HoSoNha } from "@/lib/ho-so-nha";
import { NutChiaSeNha } from "@/components/chia-se/NutChiaSeNha";
import { Undo2, Wrench } from "lucide-react";

type Sinh = { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;
interface ThanhVien { vai: "vo" | "chong" | "con" | "cha_me" | "khac"; nam: string; gioi_tinh: "nam" | "nu" }
interface Chuong {
  ma: string; tieu_de: string; cau_hoi?: string; muc: Muc | null; nhan_muc: string | null; tom_tat?: string; thieu?: string;
  hop: Hop[]; doan: string[]; can_cu: string[]; cau_tu_soi?: string | null;
  phong?: { phong: string; ten: string; cung: string; du_nien: string | null; muc: Muc; nhan_muc: string; cap_sao?: { ten: string; y: string; muc: Muc } | null; thuc_te?: string }[];
  goi_y_phong?: { phong: string; ten: string; goi_y: string }[];
  han_nam?: { ma: string; ten: string; phuong: string; nghia: string }[];
  ba_thang?: { chi_thang: string; tu_ngay?: string; ten_sao: string; muc: Muc; nhan_muc: string; y: string; sao_tai_cua: number | null }[];
  hanh_dong?: { ma: string; nhan: string; viec: string[] }[];
  /** Q5: cùng việc ấy xếp theo chi phí · Q1: trần mức vì dấu hiệu lớn chưa xử lý. */
  hanh_dong_chi_phi?: { ma: string; nhan: string; viec: string[] }[];
  tran_muc?: { muc_toi_da: Muc; ly_do: string[]; giai_thich: string };
}
/** Đồ thị tri thức theo ý định (thay Apache AGE): phòng cần nhìn, dấu hiệu nên rà, năm sao tới phía phòng. */
interface TheoYDinh {
  ma: string; ten: string; phong: { ma: string; ten: string; cung: string | null }[];
  dau_hieu: { ma: string; hoi: string; co: boolean; veto: boolean; sao_kich_hoat: number[] }[];
  hop: (Hop & { tu_chuong?: string })[]; nam_sao_toi: { phong: string; ten: string; cung: string; nam: number[]; sao: number[] }[]; loi: string;
}
interface BaoCao {
  ten: string; cot_loi: Hop[]; chuong: Chuong[]; thieu: string[]; ket: string; goi_mo?: GoiMo | null; theo_y_dinh?: TheoYDinh | null; nguyen_tac?: string;
  da_tinh: { menh_quai: { quai: string; nhom: string } | null; huong_nha: string | null; trach: { quai: string; nhom: string } | null;
    thanh_vien: { ten_vai: string; quai: string; nhom: string; cung_nhom_voi_chu: boolean | null; huong_chung: string[] }[];
    veto_da_xac_nhan?: { ma: string; tieu_de: string }[]; goc_nhin?: GocNhin };
}
/** 11 ý định chung (KB y_dinh_chung.json của engine) — chỉ nhãn để chọn; engine tra đồ thị. */
const Y_DINH: [string, string][] = [
  ["nha_cua", "Nhà cửa, sửa sang"], ["kinh_doanh_tien", "Tiền bạc, làm ăn"], ["cong_viec", "Công việc"], ["tinh_cam", "Tình cảm"],
  ["gia_dinh", "Gia đình"], ["suc_khoe", "Sức khoẻ, giấc ngủ"], ["hoc_hanh", "Học hành của con"], ["quan_he", "Hàng xóm, quan hệ"],
  ["di_xa", "Đi xa, chuyển chỗ"], ["thoi_diem", "Chọn lúc làm"], ["ban_than", "Bản thân"],
];

const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
const VAI: [ThanhVien["vai"], string][] = [["vo", "Vợ"], ["chong", "Chồng"], ["con", "Con"], ["cha_me", "Cha mẹ"], ["khac", "Người thân"]];

export function NhaCuaBan({ sinh, doHuongGoiY }: { sinh: Sinh; doHuongGoiY: number | null }) {
  const [doHuong, setDoHuong] = useState("");
  const [huong, setHuong] = useState("");
  const [theo, setTheo] = useState<"cua" | "ban_cong">("cua");
  const [namXay, setNamXay] = useState("");
  const [tv, setTv] = useState<ThanhVien[]>([]);
  const [bc, setBc] = useState<BaoCao | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [yDinh, setYDinh] = useState<string | null>(null);
  // UI-PT 4 (Y7): bài đọc TRƯỚC khi bấm "Tôi đã xử lý" một dấu hiệu lớn → so trước–sau theo chương.
  const [soSanh, setSoSanh] = useState<{ truoc: BaoCao; ma: string; tieu_de: string } | null>(null);
  // UI-PT2 P7: đầu vào của bài đọc đang hiện — máy chủ đọc lại rồi ký thẻ chia sẻ (không ký ở trình duyệt).
  const [yeuCau, setYeuCau] = useState<Record<string, unknown> | null>(null);
  const gocNhin = useGocNhin();
  useEffect(() => { if (doHuongGoiY != null) setDoHuong(String(doHuongGoiY)); }, [doHuongGoiY]);
  // KC-2: hồ sơ nhà lưu trên máy điền sẵn một lần (người dùng đổi tay thì giữ tay).
  const nhaLuu = useHoSoNha();
  // UI-PT2 P5: điền lại khi đổi CĂN đang xem (id khác) — người dùng gõ tay trong cùng một căn thì giữ tay.
  const daDien = useRef<string | null>(null);
  useEffect(() => {
    const khoa = nhaLuu ? `${nhaLuu.id ?? "_"}` : null;
    if (!nhaLuu || daDien.current === khoa) return;
    // Đổi căn thật = hai mã căn khác nhau (không phải lần điền đầu, không phải vừa "Lưu căn này để so" gắn id cho căn đang xem).
    const doiCan = daDien.current !== null && daDien.current !== "_" && khoa !== "_";
    const lanDau = daDien.current === null;
    daDien.current = khoa;
    if (!lanDau && !doiCan) return;
    if (nhaLuu.huong_do != null) { setDoHuong(String(nhaLuu.huong_do)); setHuong(""); } else if (nhaLuu.huong) { setHuong(nhaLuu.huong); setDoHuong(""); }
    setTheo(nhaLuu.theo);
    if (nhaLuu.nam_xay || doiCan) setNamXay(nhaLuu.nam_xay ? String(nhaLuu.nam_xay) : "");
    if (nhaLuu.thanh_vien.length || doiCan) setTv(nhaLuu.thanh_vien.map((x) => ({ vai: x.vai, nam: String(x.nam), gioi_tinh: x.gioi_tinh })));
    if (doiCan) { setBc(null); setSoSanh(null); }
  }, [nhaLuu]);

  const doc = async (nhaMoi?: HoSoNha | null) => {
    const nhaDung = nhaMoi === undefined ? nhaLuu : nhaMoi;
    setLoi(null);
    const d = doHuong.trim() === "" ? null : Number(doHuong.replace(",", "."));
    if (d != null && !(d >= 0 && d < 360)) { setLoi("Độ hướng cần từ 0 đến dưới 360 (0 = chính Bắc)."); return; }
    const nx = namXay.trim() === "" ? null : Number(namXay);
    if (nx != null && !(nx >= 1864 && nx <= 2150)) { setLoi("Năm xây hoặc năm dọn vào cần trong khoảng 1864–2150."); return; }
    if (d == null && !huong && !sinh) { setLoi("Cần ít nhất hướng nhà (đo hoặc chọn) hoặc năm sinh của bạn."); return; }
    const thanh_vien = tv.filter((x) => /^\d{4}$/.test(x.nam)).map((x) => ({ vai: x.vai, birth_year: Number(x.nam), gender: x.gioi_tinh }));
    setDang(true);
    try {
      // Q2/Q1: bố cục đã khai ở Khảo sát nhà (hồ sơ nhà trên máy) đi kèm → báo cáo có hình thế, trần mức, việc theo chi phí.
      // Q2/Q1: bố cục đã khai ở Khảo sát nhà (hồ sơ nhà trên máy) + dấu hiệu đã xử lý (UI-PT 4) — một hàm dựng chung (lib/ho-so-nha).
      const bo_cuc = boCucGui(nhaDung, d != null ? { huong_do: d } : huong ? { huong } : {});
      const yc = {
        ...(sinh ? { sinh } : {}),
        nha: { ...(d != null ? { huong_do: d } : huong ? { huong } : {}), ...(nx != null ? { nam_xay: nx } : {}), theo, ...(bo_cuc ? { bo_cuc } : {}) },
        ...(thanh_vien.length ? { thanh_vien } : {}),
        goc_nhin: gocNhin, ...(yDinh ? { y_dinh: yDinh } : {}),
      };
      const r = await postJson<BaoCao>("/api/phongthuy/luan-giai", yc);
      setYeuCau(yc);
      setBc(r);
      // KC-2: nhớ nhà trên máy để Hôm nay, Khảo sát, Huyền Không dùng chung (không gửi máy chủ).
      try {
        luuHoSoNha({ ...(d != null ? { huong_do: d, huong: undefined } : huong ? { huong: huong as never, huong_do: undefined } : {}),
          theo, ...(nx != null ? { nam_xay: nx } : {}), thanh_vien: thanh_vien.map((x) => ({ vai: x.vai, nam: x.birth_year, gioi_tinh: x.gender })) });
      } catch { /* bỏ qua */ }
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nha_cua_ban", co_nam_xay: nx != null, so_thanh_vien: thanh_vien.length, y_dinh: yDinh ?? "", goc_nhin: gocNhin, co_bo_cuc: Boolean(bo_cuc) });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đọc được."); }
    finally { setDang(false); }
  };

  /** UI-PT 4: "Tôi đã xử lý <dấu hiệu>" → ghi vào hồ sơ nhà trên máy, đọc lại, giữ bài cũ để so. */
  const daXuLy = (ma: string, tieu_de: string) => {
    if (!bc) return;
    const b = nhaLuu?.bo_cuc ?? {};
    let moi: HoSoNha | null = null;
    try {
      moi = luuHoSoNha({ bo_cuc: { ...b, dau_hieu: (b.dau_hieu ?? []).filter((x) => x !== ma), da_xu_ly: [...new Set([...(b.da_xu_ly ?? []), ma])] } });
    } catch { return; }
    setSoSanh({ truoc: bc, ma, tieu_de });
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "da_xu_ly", ma });
    void doc(moi);
  };
  const hoanTac = () => {
    if (!soSanh) return;
    const b = nhaLuu?.bo_cuc ?? {};
    let moi: HoSoNha | null = null;
    try {
      moi = luuHoSoNha({ bo_cuc: { ...b, dau_hieu: [...new Set([...(b.dau_hieu ?? []), soSanh.ma])], da_xu_ly: (b.da_xu_ly ?? []).filter((x) => x !== soSanh.ma) } });
    } catch { return; }
    setSoSanh(null);
    void doc(moi);
  };

  return (
    <section aria-labelledby="tieu-de-nha" className="glass space-y-5 rounded-2xl p-5 sm:p-6" data-testid="nha-cua-ban">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold"><Home className="size-5" aria-hidden /></span>
        <div>
          <h2 id="tieu-de-nha" className="text-2xl">Nhà của bạn</h2>
          <p className="text-sm text-fg-muted">Một bài đọc bằng lời thường: bạn hợp phía nào, nhà này với bạn ra sao, từng phòng nên đặt gì, tháng nào nên sửa. Phần sách vở gập lại trong “Vì sao nói vậy”.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <span className="text-fg-muted">Hướng nhà (độ la bàn, 0 = Bắc) — lấy từ phần Đo hướng hoặc nhập tay</span>
          <Input inputMode="decimal" value={doHuong} onChange={(e) => setDoHuong(e.target.value)} placeholder="vd 180" aria-label="Độ hướng nhà cho bài đọc" />
          <Select value={huong} onChange={(e) => setHuong(e.target.value)} aria-label="Hoặc chọn hướng nhà" className="h-10 text-sm" disabled={doHuong.trim() !== ""}>
            <option value="">— hoặc chọn một trong 8 hướng —</option>
            {HUONG8.map((h) => <option key={h} value={h}>{h}</option>)}
          </Select>
          <div className="flex gap-3 pt-1 text-xs text-fg-muted">
            <label className="flex cursor-pointer items-center gap-1.5"><input type="radio" className="size-3.5 accent-[rgb(var(--gold))]" checked={theo === "cua"} onChange={() => setTheo("cua")} />Đo ở cửa chính</label>
            <label className="flex cursor-pointer items-center gap-1.5"><input type="radio" className="size-3.5 accent-[rgb(var(--gold))]" checked={theo === "ban_cong"} onChange={() => setTheo("ban_cong")} />Căn hộ: đo ở ban công</label>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <span className="text-fg-muted">Năm xây hoặc năm dọn vào (không bắt buộc — có thì thêm lớp sao theo năm, tháng)</span>
          <Input inputMode="numeric" value={namXay} onChange={(e) => setNamXay(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="vd 2008" aria-label="Năm xây hoặc năm dọn vào" />
          <div className="pt-1">
            <span className="text-fg-muted">Người cùng ở (chỉ năm sinh + giới tính, không lưu)</span>
            <ul className="mt-1 space-y-1.5">
              {tv.map((x, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Select value={x.vai} onChange={(e) => setTv((a) => a.map((y, j) => j === i ? { ...y, vai: e.target.value as ThanhVien["vai"] } : y))} aria-label="Vai" className="h-9 w-28 text-xs">
                    {VAI.map(([m, t]) => <option key={m} value={m}>{t}</option>)}
                  </Select>
                  <Input inputMode="numeric" value={x.nam} onChange={(e) => setTv((a) => a.map((y, j) => j === i ? { ...y, nam: e.target.value.replace(/\D/g, "").slice(0, 4) } : y))} placeholder="năm sinh" aria-label={`Năm sinh người cùng ở ${i + 1}`} className="h-9 w-24 text-xs" />
                  <Select value={x.gioi_tinh} onChange={(e) => setTv((a) => a.map((y, j) => j === i ? { ...y, gioi_tinh: e.target.value as "nam" | "nu" } : y))} aria-label="Giới tính" className="h-9 w-20 text-xs">
                    <option value="nam">Nam</option><option value="nu">Nữ</option>
                  </Select>
                  <button type="button" aria-label="Bỏ người này" onClick={() => setTv((a) => a.filter((_, j) => j !== i))} className="grid size-9 place-items-center rounded-lg text-fg-faint hover:text-fg"><X className="size-4" /></button>
                </li>
              ))}
            </ul>
            {tv.length < 6 && (
              <button type="button" onClick={() => setTv((a) => [...a, { vai: "vo", nam: "", gioi_tinh: "nu" }])}
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-gold hover:underline"><Plus className="size-3.5" /> Thêm người cùng ở</button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm" data-testid="nha-y-dinh">
        <span className="text-fg-muted">Bạn đang băn khoăn điều gì? (không bắt buộc — bài đọc sẽ soi kỹ phần đó)</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Điều đang băn khoăn">
          {Y_DINH.map(([ma, ten]) => (
            <button key={ma} type="button" role="radio" aria-checked={yDinh === ma} onClick={() => setYDinh((v) => (v === ma ? null : ma))}
              className={cn("rounded-full border px-3 py-1 text-xs", yDinh === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{ten}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-fg-faint">Giải thích dấu hiệu:</span>
          {(Object.keys(TEN_GOC_NHIN) as GocNhin[]).map((g) => (
            <button key={g} type="button" aria-pressed={gocNhin === g} onClick={() => datGocNhin(g)} data-testid={`goc-nhin-${g}`}
              className={cn("rounded-full border px-2.5 py-0.5 text-xs", gocNhin === g ? "border-gold/70 text-gold" : "border-line text-fg-muted hover:text-fg")}>{TEN_GOC_NHIN[g]}</button>
          ))}
        </div>
      </div>
      <Button onClick={() => void doc()} disabled={dang}>{dang ? "Đang đọc…" : "Đọc nhà của tôi"}</Button>
      {!sinh && <p className="text-xs text-fg-faint">Chưa có năm sinh và giới tính trong hồ sơ: bài đọc sẽ theo hướng nhà, bỏ qua phần hợp mệnh.</p>}
      {loi && <BaoLoi loi={loi} thuLai={() => void doc()} />}

      {bc && <BaoCaoNha bc={bc} soSanh={soSanh} onDaXuLy={daXuLy} onHoanTac={hoanTac} dang={dang} />}
      {bc && <LuuNhaTaiKhoan />}
      {bc && yeuCau && <NutChiaSeNha yeuCau={yeuCau} loaiNha={nhaLuu?.loai_nha ?? null} />}
    </section>
  );
}

/** UI-PT 4: các chương đổi mức / gỡ trần sau khi xử lý một dấu hiệu. */
function khacNhau(truoc: BaoCao, sau: BaoCao) {
  return sau.chuong.flatMap((c) => {
    const t = truoc.chuong.find((x) => x.ma === c.ma);
    if (!t) return [];
    const doiMuc = t.muc !== c.muc && (t.muc || c.muc);
    const goTran = Boolean(t.tran_muc) && !c.tran_muc;
    return doiMuc || goTran ? [{ ma: c.ma, tieu_de: c.tieu_de, truoc: t.muc, sau: c.muc, goTran }] : [];
  });
}

function BaoCaoNha({ bc, soSanh, onDaXuLy, onHoanTac, dang }: {
  bc: BaoCao; soSanh: { truoc: BaoCao; ma: string; tieu_de: string } | null;
  onDaXuLy: (ma: string, tieu_de: string) => void; onHoanTac: () => void; dang: boolean;
}) {
  // HỌC-ĐS: mọi hộp có mã ds.phongthuy.* → nút "Đúng với mình / Chưa đúng" + "x% thấy đúng" (≥ 30 phiếu), một lời gọi tỉ lệ cho cả bài.
  const maus = [...bc.cot_loi, ...bc.chuong.flatMap((c) => c.hop)].map((h) => h.ma_mau).filter((x): x is string => Boolean(x));
  const tyLe = useTyLe(maus);
  return (
    <KiemChungBai.Provider value={{ tyLe, phai: PHAI_DOI_SONG.phongthuy! }}>
    <article className="space-y-8 border-t border-line/70 pt-5" data-testid="bao-cao-nha">
      {bc.cot_loi.length > 0 && (
        <section aria-label="Điều quan trọng nhất">
          <h3 className="font-serif text-xl">Điều quan trọng nhất</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {bc.cot_loi.map((h, i) => <HopNoiBat key={i} hop={h} className={bc.cot_loi.length % 2 && i === 0 ? "md:col-span-2" : undefined} />)}
          </div>
        </section>
      )}
      {(soSanh || (bc.da_tinh.veto_da_xac_nhan?.length ?? 0) > 0) && (
        <section aria-labelledby="nha-da-xu-ly-td" className="rounded-2xl border border-line/70 bg-bg/40 p-4" data-testid="nha-da-xu-ly">
          <h3 id="nha-da-xu-ly-td" className="flex items-center gap-2 font-serif text-lg"><Wrench className="size-4 text-gold" aria-hidden /> Đã xử lý rồi? Xem bài đọc đổi thế nào</h3>
          {soSanh && (
            <div className="mt-2 rounded-xl border border-jade/40 bg-jade/[0.06] p-3 text-sm" data-testid="nha-so-sanh">
              <p className="text-fg">Sau khi xử lý <b>{soSanh.tieu_de.toLowerCase()}</b>:</p>
              {(() => {
                const kh = khacNhau(soSanh.truoc, bc);
                const con = bc.da_tinh.veto_da_xac_nhan ?? [];
                return (
                  <>
                    {kh.length > 0 ? (
                      <ul className="mt-1 space-y-0.5">
                        {kh.map((k) => (
                          <li key={k.ma} className="flex flex-wrap items-center gap-1.5">
                            <span>{k.tieu_de}:</span>
                            {k.truoc && <ChipMuc muc={k.truoc} />}{k.truoc && k.sau && <span aria-hidden>→</span>}{k.sau && <ChipMuc muc={k.sau} />}
                            {k.goTran && <span className="text-xs text-jade">không còn trần mức</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-fg-muted">Mức các chương chưa đổi{con.length ? <> — còn {con.length} dấu hiệu lớn chưa xử lý: {con.map((v) => v.tieu_de.toLowerCase()).join(", ")}.</> : "."}</p>
                    )}
                    <button type="button" onClick={onHoanTac} disabled={dang} className="mt-2 inline-flex items-center gap-1 text-xs text-fg-muted underline-offset-4 hover:underline"><Undo2 className="size-3" aria-hidden /> Chưa xử lý xong, hoàn tác</button>
                  </>
                );
              })()}
            </div>
          )}
          {(bc.da_tinh.veto_da_xac_nhan?.length ?? 0) > 0 && (
            <>
              <p className="mt-2 text-sm text-fg-muted">Bấm vào dấu hiệu bạn đã xử lý (che xà, dời đồ, đổi cách dùng…) — bài đọc tính lại ngay, so với trước. Ghi nhớ trên máy, không gửi đi đâu.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bc.da_tinh.veto_da_xac_nhan!.map((v) => (
                  <button key={v.ma} type="button" disabled={dang} onClick={() => onDaXuLy(v.ma, v.tieu_de)}
                    className="rounded-full border border-moon/50 px-3 py-1 text-xs text-moon hover:bg-moon/10 disabled:opacity-50">Đã xử lý: {v.tieu_de}</button>
                ))}
              </div>
            </>
          )}
        </section>
      )}
      {bc.theo_y_dinh && <TheoYDinhKhoi t={bc.theo_y_dinh} />}
      <nav aria-label="Mục lục bài đọc nhà" className="flex flex-wrap gap-1.5 text-xs">
        {bc.chuong.map((c, i) => (
          <a key={c.ma} href={`#nha-${c.ma}`} className="inline-flex items-center gap-1.5 rounded-full border border-line/70 px-2.5 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">
            {i + 1}. {c.tieu_de}{c.muc && <span data-muc={c.muc} className="cham-muc size-1.5 rounded-full" aria-hidden />}
          </a>
        ))}
      </nav>
      {bc.chuong.map((c, i) => <ChuongNha key={c.ma} c={c} so={i + 1} huongNha={bc.da_tinh.huong_nha} />)}
      {bc.goi_mo && <GoiMoCheo goiMo={bc.goi_mo} moDun="phongthuy" />}
      {bc.nguyen_tac && <p className="text-xs text-fg-faint" data-testid="nha-nguyen-tac">{bc.nguyen_tac}</p>}
      <p className="border-t border-line pt-4 text-sm text-fg-faint">{bc.ket}</p>
    </article>
    </KiemChungBai.Provider>
  );
}

function TheoYDinhKhoi({ t }: { t: TheoYDinh }) {
  return (
    <section aria-labelledby="nha-theo-y-dinh" className="rounded-2xl border border-gold/40 bg-gold/[0.06] p-4" data-testid="nha-theo-y-dinh">
      <h3 id="nha-theo-y-dinh" className="font-serif text-xl">Theo điều bạn đang băn khoăn: {t.ten.toLowerCase()}</h3>
      <p className="mt-1 text-sm text-fg-muted">Phòng nên nhìn trước: {t.phong.map((p) => p.ten.toLowerCase() + (p.cung ? ` (phía ${p.cung})` : "")).join(", ")}.</p>
      {t.dau_hieu.length > 0 && (
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2" data-testid="nha-dau-hieu-ra">
          {t.dau_hieu.map((d) => (
            <li key={d.ma} className={cn("flex items-start gap-2", d.co ? "text-fg" : "text-fg-muted")}>
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", d.co ? "bg-moon" : "bg-line")} aria-hidden />
              <span>{d.hoi}{d.co ? <b className="ml-1 text-moon">— bạn đã khai có{d.veto ? ", xử lý trước" : ""}</b> : <span className="ml-1 text-xs text-fg-faint">— rà xem ở Khảo sát nhà</span>}</span>
            </li>
          ))}
        </ul>
      )}
      {t.hop.length > 0 && <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">{t.hop.map((h, i) => <HopNoiBat key={i} hop={h} />)}</div>}
      {t.nam_sao_toi.length > 0 && (
        <p className="mt-3 text-sm text-fg-muted" data-testid="nha-nam-sao-toi">Năm nên chủ động hơn với phòng này (sao năm bay tới): {t.nam_sao_toi.map((x) => `${x.ten.toLowerCase()} ${x.nam.join(", ")}`).join(" · ")}. {t.loi}</p>
      )}
    </section>
  );
}

function ChuongNha({ c, so, huongNha }: { c: Chuong; so: number; huongNha?: string | null }) {
  const [nhom, setNhom] = useState(0);
  const [theoChiPhi, setTheoChiPhi] = useState(false);
  const hanhDong = theoChiPhi && c.hanh_dong_chi_phi ? c.hanh_dong_chi_phi : c.hanh_dong;
  return (
    <section id={`nha-${c.ma}`} aria-labelledby={`nha-td-${c.ma}`} className="scroll-mt-24" data-testid={`nha-chuong-${c.ma}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h3 id={`nha-td-${c.ma}`} className="font-serif text-xl"><span className="text-gold">{so}.</span> {c.tieu_de}</h3>
        {c.muc && <ChipMuc muc={c.muc} nhan={c.nhan_muc ?? undefined} />}
        {c.tran_muc && <span className="text-xs text-moon" data-testid="nha-tran-muc" title={c.tran_muc.giai_thich}>tối đa {NHAN_MUC[c.tran_muc.muc_toi_da]} cho tới khi xử lý: {c.tran_muc.ly_do.join(", ").toLowerCase()}</span>}
      </div>
      {c.cau_hoi && <p className="mt-0.5 text-xs text-fg-faint">{c.cau_hoi}</p>}
      {c.tom_tat && <p className={cn("mt-2 leading-relaxed", c.thieu ? "rounded-xl border border-dashed border-line px-4 py-2.5 text-sm text-fg-muted" : "text-lg text-fg")} data-testid="nha-tom-tat">{c.tom_tat}</p>}
      {c.hop.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">{c.hop.map((h, k) => <HopNoiBat key={`${h.loai}-${k}`} hop={h} />)}</div>
      )}
      {c.phong && c.phong.length > 0 && (
        <SoDoNha className="mt-3" huongNha={huongNha} duNien={Object.fromEntries(c.phong.map((p) => [p.cung, p.du_nien]))}
          phong={c.phong.map((p) => ({ cung: p.cung, ten: p.ten, muc: p.muc }))} />
      )}
      {c.phong && c.phong.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="nha-phong">
          {c.phong.map((p) => (
            <li key={p.phong} className="rounded-xl border border-line/70 bg-bg/40 p-3 text-sm">
              <p className="flex items-center justify-between gap-2"><b>{p.ten}</b> <ChipMuc muc={p.muc} nhan={p.nhan_muc} /></p>
              <p className="text-fg-muted">Phía {p.cung}{p.du_nien ? ` · ${p.du_nien}` : ""}{p.cap_sao ? ` · sao ${p.cap_sao.ten}` : ""}</p>
              {p.thuc_te && <p className="mt-1 text-xs text-fg-faint">{p.thuc_te}</p>}
            </li>
          ))}
        </ul>
      )}
      {c.goi_y_phong && c.goi_y_phong.length > 0 && (!c.phong || c.phong.length === 0) && (
        <ul className="mt-3 space-y-1 text-sm text-fg" data-testid="nha-goi-y-phong">
          {c.goi_y_phong.map((g) => <li key={g.phong} className="flex gap-2"><span className="text-gold">•</span><span>{g.goi_y}</span></li>)}
        </ul>
      )}
      {c.ba_thang && c.ba_thang.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" data-testid="nha-ba-thang">
          {c.ba_thang.map((t) => (
            <div key={t.chi_thang} data-muc={t.muc} className="chip-muc rounded-xl px-3 py-2 text-sm">
              <p className="font-semibold">Tháng {t.chi_thang} · {t.nhan_muc}{t.tu_ngay ? <span className="font-normal opacity-70"> · từ {Number(t.tu_ngay.slice(8, 10))}/{Number(t.tu_ngay.slice(5, 7))}</span> : null}</p>
              <p className="text-xs opacity-80">{t.y}</p>
              {t.muc === "thuan" && t.tu_ngay && (
                <NhacToi className="mt-1.5" ngay={t.tu_ngay} ma={`pt.thang.${t.chi_thang.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase()}`} moDun="phongthuy"
                  nhan={`Tháng ${t.chi_thang} — tháng thuận sửa sang, kê lại phía cửa`} duong="/phong-thuy#nha-cua-ban" />
              )}
            </div>
          ))}
        </div>
      )}
      {c.han_nam && c.han_nam.length > 0 && (
        <p className="mt-3 text-sm text-fg-muted" data-testid="nha-han-nam">Phía năm nay nên giữ yên: {c.han_nam.map((h) => `${h.phuong} (${h.ten})`).join(" · ")}.</p>
      )}
      {hanhDong && hanhDong.length > 0 && (
        <div className="mt-3 rounded-xl border border-line/70 bg-surface/40 p-3" data-testid="nha-hanh-dong">
          {c.hanh_dong_chi_phi && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
              <span>Xếp theo:</span>
              <button type="button" aria-pressed={!theoChiPhi} onClick={() => { setTheoChiPhi(false); setNhom(0); }} className={cn("rounded-full border px-2.5 py-0.5", !theoChiPhi ? "border-gold/70 text-gold" : "border-line text-fg-muted")}>thời điểm</button>
              <button type="button" aria-pressed={theoChiPhi} onClick={() => { setTheoChiPhi(true); setNhom(0); }} data-testid="nha-theo-chi-phi" className={cn("rounded-full border px-2.5 py-0.5", theoChiPhi ? "border-gold/70 text-gold" : "border-line text-fg-muted")}>chi phí</button>
            </div>
          )}
          <div role="tablist" className="flex flex-wrap gap-1.5">
            {hanhDong.map((n, i) => (
              <button key={n.ma} role="tab" type="button" aria-selected={i === nhom} onClick={() => setNhom(i)}
                className={cn("rounded-full border px-3 py-1 text-xs", i === nhom ? "border-gold/70 text-gold" : "border-line text-fg-muted hover:text-fg")}>{n.nhan}</button>
            ))}
          </div>
          <ul role="tabpanel" className="mt-3 list-disc space-y-1.5 pl-5 text-[0.95rem] text-fg">
            {(hanhDong[nhom] ?? hanhDong[0])?.viec.map((v) => <li key={v}>{v}</li>)}
          </ul>
        </div>
      )}
      {c.doan.length > 0 && <div className="mt-3 space-y-2 text-[0.95rem] leading-relaxed text-fg-muted">{c.doan.map((d, i) => <p key={i}>{d}</p>)}</div>}
      {c.cau_tu_soi && (
        <p className="mt-3 rounded-xl bg-moon/10 px-4 py-2.5 text-moon"><span className="text-xs font-semibold uppercase tracking-wider">Tự hỏi mình</span><span className="mt-0.5 block italic">{c.cau_tu_soi}</span></p>
      )}
      <ViSao canCu={c.can_cu} />
    </section>
  );
}
