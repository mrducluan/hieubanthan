"use client";
// PT-ĐS — "Nhà của bạn": báo cáo đời thường 5 chương (Bạn hợp hướng nào · Ngôi nhà này với bạn · Từng phòng · Năm nay và
// 3 tháng tới · Việc nên làm). Người dùng chỉ nhập hướng cửa (hoặc ban công), năm xây, người cùng ở; engine dựng mọi chữ.
// Tầng đời thường hiện ngay (mức, hộp nổi bật, việc nên làm); tầng học thuật (du niên, phi tinh, cặp sao) gập trong
// "Vì sao nói vậy". Không lưu gì; thành viên chỉ gửi năm sinh + giới tính.
import { useEffect, useRef, useState } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { ChipMuc } from "@/components/luan-giai/BaoCaoDoiSong";
import { HopNoiBat, KiemChungBai, ViSao } from "@/components/luan-giai/HopNoiBat";
import { CongTacCheDoDoc, KhungUngDungCoDien } from "@/components/luan-giai/CheDoDoc";
import { useTyLe } from "@/lib/ty-le-kiem-chung";
import { PHAI_DOI_SONG } from "@/lib/kiem-chung";
import type { Hop, Muc, UngDungCoDien } from "@/components/luan-giai/kieu";
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
import { DoHinhTamYeu, type CapDoHinh } from "@/components/phong-thuy/DoHinhTamYeu";
import { NHAN_MUC } from "@/components/luan-giai/kieu";
import { coHuongNha, nhaGui, type HoSoNha } from "@/lib/ho-so-nha";
import { DongNha } from "@/components/phong-thuy/NhaCuaToi";
import { NutChiaSeNha } from "@/components/chia-se/NutChiaSeNha";
import { Undo2, Wrench } from "lucide-react";
import { ChanQr } from "@/components/khung/ChanQr";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { TenHienProvider } from "@/components/khung/TenHien";
import type { TenHien } from "@/lib/ten-hien";
import { SachXuaNoi, type CauSachXua } from "@/components/huyen-hoc/SachXuaNoi";

type Sinh = { birth_date: string; gender: "nam" | "nu"; moc_nam?: MocNam } | null;
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
  /** TY-2: Cửa – Chủ – Bếp theo Dương Trạch Tam Yếu (một bộ tính với công cụ tra nhanh) — để vẽ đồ hình. */
  tam_yeu?: { huong: { cua: string; chu: string | null; bep: string | null }; cap: CapDoHinh[]; ket_luan: { muc: Muc; loi: string } };
}
/** Đồ thị tri thức theo ý định (thay Apache AGE): phòng cần nhìn, dấu hiệu nên rà, năm sao tới phía phòng. */
interface TheoYDinh {
  ma: string; ten: string; phong: { ma: string; ten: string; cung: string | null }[];
  dau_hieu: { ma: string; hoi: string; co: boolean; veto: boolean; sao_kich_hoat: number[] }[];
  hop: (Hop & { tu_chuong?: string })[]; nam_sao_toi: { phong: string; ten: string; cung: string; nam: number[]; sao: number[] }[]; loi: string;
}
interface BaoCao {
  ten: string; cot_loi: Hop[]; chuong: Chuong[]; thieu: string[]; ket: string; goi_mo?: GoiMo | null; theo_y_dinh?: TheoYDinh | null; nguyen_tac?: string;
  ten_hien?: TenHien;
  /** WS-3: câu Dương Trạch Thập Thư chọn theo mệnh quái của bạn + người cùng nhà khác nhóm. */
  sach_xua?: CauSachXua[];
  ung_dung_co_dien?: UngDungCoDien;
  da_tinh: { menh_quai: { quai: string; nhom: string } | null; huong_nha: string | null; trach: { quai: string; nhom: string } | null;
    thanh_vien: { ten_vai: string; quai: string; nhom: string; cung_nhom_voi_chu: boolean | null; huong_chung: string[] }[];
    veto_da_xac_nhan?: { ma: string; tieu_de: string }[]; goc_nhin?: GocNhin };
}
/** 11 ý định chung (KB y_dinh_chung.json của engine) — chỉ mã để chọn; nhãn ở bảng chữ (`nc.y.<mã>`); engine tra đồ thị. */
export const Y_DINH = ["nha_cua", "kinh_doanh_tien", "cong_viec", "tinh_cam", "gia_dinh", "suc_khoe", "hoc_hanh", "quan_he", "di_xa", "thoi_diem", "ban_than"] as const;


export function NhaCuaBan({ sinh, yDinhGoiY }: {
  sinh: Sinh;
  /** HG-1: câu hỏi người dùng vừa chọn ở thẻ "Hỏi gì xem nấy" → chọn sẵn điều băn khoăn tương ứng (đổi tay vẫn được). */
  yDinhGoiY?: (typeof Y_DINH)[number] | null;
}) {
  const [bc, setBc] = useState<BaoCao | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [yDinh, setYDinh] = useState<string | null>(null);
  useEffect(() => { if (yDinhGoiY) setYDinh(yDinhGoiY); }, [yDinhGoiY]);
  // UI-PT 4 (Y7): bài đọc TRƯỚC khi bấm "Tôi đã xử lý" một dấu hiệu lớn → so trước–sau theo chương.
  const [soSanh, setSoSanh] = useState<{ truoc: BaoCao; ma: string; tieu_de: string } | null>(null);
  // UI-PT2 P7: đầu vào của bài đọc đang hiện — máy chủ đọc lại rồi ký thẻ chia sẻ (không ký ở trình duyệt).
  const [yeuCau, setYeuCau] = useState<Record<string, unknown> | null>(null);
  const gocNhin = useGocNhin();
  const { c: t, en } = useChuPT();
  // PT-NHA: hướng, chỗ đo, năm xây (hoặc vận), người cùng ở, bố cục — tất cả từ hồ sơ nhà (thẻ "Nhà của tôi"); khối này
  // không còn ô nhập riêng. Đổi căn đang xem (id khác) thì bỏ bài đọc cũ.
  const nhaLuu = useHoSoNha();
  const idCan = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (nhaLuu === undefined) return;
    const id = nhaLuu?.id ?? null;
    if (idCan.current !== undefined && idCan.current !== id && idCan.current !== null && id !== null) { setBc(null); setSoSanh(null); }
    idCan.current = id;
  }, [nhaLuu]);

  const dungYeuCau = (nhaDung: HoSoNha | null | undefined): Record<string, unknown> => {
    const g = nhaDung ? nhaGui(nhaDung) : { nha: { theo: "cua" as const } };
    return { ...(sinh ? { sinh } : {}), ...g, goc_nhin: gocNhin, ...(yDinh ? { y_dinh: yDinh } : {}) };
  };
  const coHuong = coHuongNha(nhaLuu);
  // Bài đang hiện dựng từ hồ sơ cũ (người dùng vừa sửa ở "Nhà của tôi") → nhắc đọc lại, không tự gọi lại.
  // Chỉ so phần NHÀ + người (đổi chip băn khoăn / góc nhìn không phải "nhà vừa đổi").
  const khoaNha = (yc: Record<string, unknown>) => JSON.stringify([yc.sinh ?? null, yc.nha ?? null, yc.thanh_vien ?? null]);
  const cu = Boolean(bc && yeuCau && !soSanh && khoaNha(dungYeuCau(nhaLuu)) !== khoaNha(yeuCau));

  const doc = async (nhaMoi?: HoSoNha | null) => {
    const nhaDung = nhaMoi === undefined ? nhaLuu : nhaMoi;
    setLoi(null);
    if (!coHuongNha(nhaDung) && !sinh) { setLoi(t("nc.loi_thieu")); return; }
    setDang(true);
    try {
      // Q2/Q1: bố cục đã khai ở Khảo sát nhà + dấu hiệu đã xử lý (UI-PT 4) + nhiều lớp + người cùng ở — một hàm dựng chung.
      const yc = dungYeuCau(nhaDung);
      const r = await postJson<BaoCao>("/api/phongthuy/luan-giai", yc);
      setYeuCau(yc);
      setBc(r);
      const n = (yc.nha ?? {}) as Record<string, unknown>;
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "nha_cua_ban", co_nam_xay: Boolean(n.nam_xay || n.van_xay), so_thanh_vien: nhaDung?.thanh_vien.length ?? 0,
        y_dinh: yDinh ?? "", goc_nhin: gocNhin, co_bo_cuc: Boolean(n.bo_cuc) });
    } catch (e) { setLoi(e instanceof Error ? e.message : t("nc.loi_doc")); }
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
          <h2 id="tieu-de-nha" className="text-2xl">{t("nc.tieu_de")}</h2>
          <p className="text-sm text-fg-muted">{t("nc.mo_ta")}</p>
        </div>
      </div>

      <DongNha namTuyChon testId="dong-nha-nc" />
      <div className="space-y-2 text-sm" data-testid="nha-y-dinh">
        <span className="text-fg-muted">{t("nc.ban_khoan")}</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("nc.ban_khoan_aria")}>
          {Y_DINH.map((ma) => (
            <button key={ma} type="button" role="radio" aria-checked={yDinh === ma} onClick={() => setYDinh((v) => (v === ma ? null : ma))}
              className={cn("rounded-full border px-3 py-1 text-xs", yDinh === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>{t(`nc.y.${ma}`)}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-fg-faint">{t("nc.giai_thich")}</span>
          {(Object.keys(TEN_GOC_NHIN) as GocNhin[]).map((g) => (
            <button key={g} type="button" aria-pressed={gocNhin === g} onClick={() => datGocNhin(g)} data-testid={`goc-nhin-${g}`}
              className={cn("rounded-full border px-2.5 py-0.5 text-xs", gocNhin === g ? "border-gold/70 text-gold" : "border-line text-fg-muted hover:text-fg")}>{t(`goc.${g}`)}</button>
          ))}
        </div>
      </div>
      {cu && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border border-gold/40 bg-gold/5 px-3 py-2 text-xs text-fg-muted" role="status" data-testid="nha-doi">
          {t("nt.doi_nha")}
          <button type="button" onClick={() => void doc()} disabled={dang} className="min-h-8 rounded-full border border-gold/60 px-3 text-gold">{t("nt.doc_lai")}</button>
        </p>
      )}
      <Button onClick={() => void doc()} disabled={dang || (!coHuong && !sinh)}>{dang ? t("nc.dang_doc") : t("nc.doc")}</Button>
      {!sinh && <p className="text-xs text-fg-faint">{t("nc.chua_sinh")}</p>}
      {loi && <BaoLoi loi={loi} thuLai={() => void doc()} />}

      {bc && <TenHienProvider ten={[bc.ten_hien]}><BaoCaoNha bc={bc} soSanh={soSanh} onDaXuLy={daXuLy} onHoanTac={hoanTac} dang={dang} /></TenHienProvider>}
      {/* EN-ALL GĐ 5: bản Anh chưa có tài khoản / thẻ chia sẻ (GĐ 9) → không hiện lưu nhà vào tài khoản, thẻ nhà. */}
      {bc && !en && <LuuNhaTaiKhoan />}
      {bc && yeuCau && !en && <NutChiaSeNha yeuCau={yeuCau} loaiNha={nhaLuu?.loai_nha ?? null} huong={bc.da_tinh.huong_nha} />}
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
  const { c: t, en } = useChuPT();
  return (
    <KiemChungBai.Provider value={{ tyLe, phai: PHAI_DOI_SONG.phongthuy! }}>
    <article className="space-y-8 border-t border-line/70 pt-5" data-testid="bao-cao-nha">
      <div>
        <CongTacCheDoDoc moDun="phongthuy" nho />
        <KhungUngDungCoDien u={bc.ung_dung_co_dien} />
      </div>
      {bc.cot_loi.length > 0 && (
        <section aria-label={t("nc.quan_trong")}>
          <h3 className="font-serif text-xl">{t("nc.quan_trong")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {bc.cot_loi.map((h, i) => <HopNoiBat key={i} hop={h} className={bc.cot_loi.length % 2 && i === 0 ? "md:col-span-2" : undefined} />)}
          </div>
        </section>
      )}
      {(soSanh || (bc.da_tinh.veto_da_xac_nhan?.length ?? 0) > 0) && (
        <section aria-labelledby="nha-da-xu-ly-td" className="rounded-2xl border border-line/70 bg-bg/40 p-4" data-testid="nha-da-xu-ly">
          <h3 id="nha-da-xu-ly-td" className="flex items-center gap-2 font-serif text-lg"><Wrench className="size-4 text-gold" aria-hidden /> {t("nc.da_xu_ly_td")}</h3>
          {soSanh && (
            <div className="mt-2 rounded-xl border border-jade/40 bg-jade/[0.06] p-3 text-sm" data-testid="nha-so-sanh">
              <p className="text-fg">{t("nc.sau_xu_ly")}<b>{soSanh.tieu_de.toLowerCase()}</b>:</p>
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
                            {k.goTran && <span className="text-xs text-jade">{t("nc.het_tran")}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-fg-muted">{t("nc.chua_doi")}{con.length ? (en ? t("nc.con_lai", { so: String(con.length), ds: con.map((v) => v.tieu_de.toLowerCase()).join(", ") }) : <> — còn {con.length} dấu hiệu lớn chưa xử lý: {con.map((v) => v.tieu_de.toLowerCase()).join(", ")}.</>) : "."}</p>
                    )}
                    <button type="button" onClick={onHoanTac} disabled={dang} className="mt-2 inline-flex items-center gap-1 text-xs text-fg-muted underline-offset-4 hover:underline"><Undo2 className="size-3" aria-hidden /> {t("nc.hoan_tac")}</button>
                  </>
                );
              })()}
            </div>
          )}
          {(bc.da_tinh.veto_da_xac_nhan?.length ?? 0) > 0 && (
            <>
              <p className="mt-2 text-sm text-fg-muted">{t("nc.bam_xu_ly")}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bc.da_tinh.veto_da_xac_nhan!.map((v) => (
                  <button key={v.ma} type="button" disabled={dang} onClick={() => onDaXuLy(v.ma, v.tieu_de)}
                    className="rounded-full border border-moon/50 px-3 py-1 text-xs text-moon hover:bg-moon/10 disabled:opacity-50">{t("nc.da_xu_ly", { x: v.tieu_de })}</button>
                ))}
              </div>
            </>
          )}
        </section>
      )}
      {bc.theo_y_dinh && <TheoYDinhKhoi t={bc.theo_y_dinh} />}
      <nav aria-label={t("nc.muc_luc")} className="flex flex-wrap gap-1.5 text-xs">
        {bc.chuong.map((c, i) => (
          <a key={c.ma} href={`#nha-${c.ma}`} className="inline-flex items-center gap-1.5 rounded-full border border-line/70 px-2.5 py-1 text-fg-muted hover:border-gold/60 hover:text-fg">
            {i + 1}. {c.tieu_de}{c.muc && <span data-muc={c.muc} className="cham-muc size-1.5 rounded-full" aria-hidden />}
          </a>
        ))}
      </nav>
      {bc.chuong.map((c, i) => <ChuongNha key={c.ma} c={c} so={i + 1} huongNha={bc.da_tinh.huong_nha} />)}
      <SachXuaNoi ds={bc.sach_xua} moDun="phongthuy" tieuDe={en ? "What the classics say about your home" : "Sách xưa nói gì về nhà của bạn"}
        moTa={en ? "Passages from the Yangzhai Shishu that match your trigram and the people you live with. The English lines are our editors' summaries; open any card to see the original." : "Câu chép trong Dương Trạch Thập Thư ứng với đúng mệnh của bạn và người cùng nhà. Lời Việt là phần tóm ý của ban biên tập; bấm vào từng câu để xem nguyên văn."} />
      {bc.goi_mo && !en && <GoiMoCheo goiMo={bc.goi_mo} moDun="phongthuy" />}
      {bc.nguyen_tac && <p className="text-xs text-fg-faint" data-testid="nha-nguyen-tac">{bc.nguyen_tac}</p>}
      <p className="border-t border-line pt-4 text-sm text-fg-faint">{bc.ket}</p>
    </article>
    </KiemChungBai.Provider>
  );
}

function TheoYDinhKhoi({ t }: { t: TheoYDinh }) {
  const { c, en, huong } = useChuPT();
  return (
    <section aria-labelledby="nha-theo-y-dinh" className="rounded-2xl border border-gold/40 bg-gold/[0.06] p-4" data-testid="nha-theo-y-dinh">
      <h3 id="nha-theo-y-dinh" className="font-serif text-xl">{c("nc.theo_y", { x: t.ten.toLowerCase() })}</h3>
      <p className="mt-1 text-sm text-fg-muted">{c("nc.phong_truoc", { ds: t.phong.map((p) => p.ten.toLowerCase() + (p.cung ? c("nc.phia", { x: en ? huong(p.cung) : p.cung }) : "")).join(", ") })}</p>
      {t.dau_hieu.length > 0 && (
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2" data-testid="nha-dau-hieu-ra">
          {t.dau_hieu.map((d) => (
            <li key={d.ma} className={cn("flex items-start gap-2", d.co ? "text-fg" : "text-fg-muted")}>
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", d.co ? "bg-moon" : "bg-line")} aria-hidden />
              <span>{d.hoi}{d.co ? <b className="ml-1 text-moon">{c("nc.da_khai")}{d.veto ? c("nc.xu_ly_truoc") : ""}</b> : <span className="ml-1 text-xs text-fg-faint">{c("nc.ra_khao_sat")}</span>}</span>
            </li>
          ))}
        </ul>
      )}
      {t.hop.length > 0 && <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">{t.hop.map((h, i) => <HopNoiBat key={i} hop={h} />)}</div>}
      {t.nam_sao_toi.length > 0 && (
        <p className="mt-3 text-sm text-fg-muted" data-testid="nha-nam-sao-toi">{c("nc.nam_sao", { ds: t.nam_sao_toi.map((x) => `${x.ten.toLowerCase()} ${x.nam.join(", ")}`).join(" · ") })}{t.loi}</p>
      )}
    </section>
  );
}

function ChuongNha({ c, so, huongNha }: { c: Chuong; so: number; huongNha?: string | null }) {
  const [nhom, setNhom] = useState(0);
  const [theoChiPhi, setTheoChiPhi] = useState(false);
  const hanhDong = theoChiPhi && c.hanh_dong_chi_phi ? c.hanh_dong_chi_phi : c.hanh_dong;
  const { c: t, en, huong, duNien, ten } = useChuPT();
  const ngayNgan = (iso: string) => (en ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`))
    : `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`);
  return (
    <section id={`nha-${c.ma}`} aria-labelledby={`nha-td-${c.ma}`} className="scroll-mt-24" data-testid={`nha-chuong-${c.ma}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h3 id={`nha-td-${c.ma}`} className="font-serif text-xl"><span className="text-gold">{so}.</span> {c.tieu_de}</h3>
        {c.muc && <ChipMuc muc={c.muc} nhan={c.nhan_muc ?? undefined} />}
        {c.tran_muc && <span className="text-xs text-moon" data-testid="nha-tran-muc" title={c.tran_muc.giai_thich}>{en ? t("nc.toi_da", { muc: t(`nc.muc.${c.tran_muc.muc_toi_da}`), ly_do: c.tran_muc.ly_do.join(", ").toLowerCase() }) : <>tối đa {NHAN_MUC[c.tran_muc.muc_toi_da]} cho tới khi xử lý: {c.tran_muc.ly_do.join(", ").toLowerCase()}</>}</span>}
      </div>
      {c.cau_hoi && <p className="mt-0.5 text-xs text-fg-faint">{c.cau_hoi}</p>}
      {c.tom_tat && <p className={cn("mt-2 leading-relaxed", c.thieu ? "rounded-xl border border-dashed border-line px-4 py-2.5 text-sm text-fg-muted" : "text-lg text-fg")} data-testid="nha-tom-tat">{c.tom_tat}</p>}
      {c.hop.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">{c.hop.map((h, k) => <HopNoiBat key={`${h.loai}-${k}`} hop={h} />)}</div>
      )}
      {c.phong && c.phong.length > 0 && (
        <div className="mt-3 flex flex-wrap items-start gap-4">
        <SoDoNha huongNha={huongNha} duNien={Object.fromEntries(c.phong.map((p) => [p.cung, p.du_nien]))}
          phong={c.phong.map((p) => ({ cung: p.cung, ten: p.ten, muc: p.muc }))} />
        {c.tam_yeu && c.tam_yeu.cap.length > 0 && <DoHinhTamYeu huong={c.tam_yeu.huong} cap={c.tam_yeu.cap} />}
        </div>
      )}
      {c.phong && c.phong.length > 0 && <ChanQr className="max-w-sm" nhan={t("nc.qr")} />}
      {c.phong && c.phong.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="nha-phong">
          {c.phong.map((p) => (
            <li key={p.phong} className="rounded-xl border border-line/70 bg-bg/40 p-3 text-sm">
              <p className="flex items-center justify-between gap-2"><b>{p.ten}</b> <ChipMuc muc={p.muc} nhan={p.nhan_muc} /></p>
              <p className="text-fg-muted">{t("nc.phia_phong", { x: huong(p.cung) })}{p.du_nien ? ` · ${duNien(p.du_nien)}` : ""}{p.cap_sao ? t("nc.sao", { x: p.cap_sao.ten }) : ""}</p>
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
          {c.ba_thang.map((th) => (
            <div key={th.chi_thang} data-muc={th.muc} className="chip-muc rounded-xl px-3 py-2 text-sm">
              <p className="font-semibold">{en ? t("nc.thang", { x: ten("chi", th.chi_thang), muc: th.nhan_muc }) : <>Tháng {th.chi_thang} · {th.nhan_muc}</>}{th.tu_ngay ? (en ? <span className="font-normal opacity-70">{t("nc.tu_ngay", { ngay: ngayNgan(th.tu_ngay) })}</span> : <span className="font-normal opacity-70"> · từ {Number(th.tu_ngay.slice(8, 10))}/{Number(th.tu_ngay.slice(5, 7))}</span>) : null}</p>
              <p className="text-xs opacity-80">{th.y}</p>
              {th.muc === "thuan" && th.tu_ngay && !en && (
                <NhacToi className="mt-1.5" ngay={th.tu_ngay} ma={`pt.thang.${th.chi_thang.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase()}`} moDun="phongthuy"
                  nhan={`Tháng ${th.chi_thang} — tháng thuận sửa sang, kê lại phía cửa`} duong="/phong-thuy#nha-cua-ban" />
              )}
            </div>
          ))}
        </div>
      )}
      {c.han_nam && c.han_nam.length > 0 && (
        <p className="mt-3 text-sm text-fg-muted" data-testid="nha-han-nam">{t("nc.giu_yen", { ds: en
          // Bản Anh: gom theo phương ("North: Year Breaker (Sui Po), Three Killings (San Sha)") — không lồng ngoặc, không lặp phương.
          ? [...new Set(c.han_nam.map((h) => h.phuong))].map((p) => `${huong(p)}: ${c.han_nam!.filter((h) => h.phuong === p).map((h) => h.ten).join(", ")}`).join(" · ")
          : c.han_nam.map((h) => `${huong(h.phuong)} (${h.ten})`).join(" · ") })}</p>
      )}
      {hanhDong && hanhDong.length > 0 && (
        <div className="mt-3 rounded-xl border border-line/70 bg-surface/40 p-3" data-testid="nha-hanh-dong">
          {c.hanh_dong_chi_phi && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
              <span>{t("nc.xep_theo")}</span>
              <button type="button" aria-pressed={!theoChiPhi} onClick={() => { setTheoChiPhi(false); setNhom(0); }} className={cn("rounded-full border px-2.5 py-0.5", !theoChiPhi ? "border-gold/70 text-gold" : "border-line text-fg-muted")}>{t("nc.thoi_diem")}</button>
              <button type="button" aria-pressed={theoChiPhi} onClick={() => { setTheoChiPhi(true); setNhom(0); }} data-testid="nha-theo-chi-phi" className={cn("rounded-full border px-2.5 py-0.5", theoChiPhi ? "border-gold/70 text-gold" : "border-line text-fg-muted")}>{t("nc.chi_phi")}</button>
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
        <p className="mt-3 rounded-xl bg-moon/10 px-4 py-2.5 text-moon"><span className="text-xs font-semibold uppercase tracking-wider">{t("nc.tu_hoi")}</span><span className="mt-0.5 block italic">{c.cau_tu_soi}</span></p>
      )}
      <ViSao canCu={c.can_cu} />
    </section>
  );
}
