"use client";
// NT-1 — trang công cụ Nhân tướng học (chủ dự án giao 2026-11-06). Phương án UI đã chọn: "Gương soi có hướng dẫn" —
// bản đồ gương mặt là nhân vật chính, khảo sát sáu bước sáng đúng vùng đang hỏi, bài đọc tám chương khuôn doi_song_1.
// Không ảnh (ảnh chỉ để tự chấm 4 điểm trên máy, không rời máy); câu trả lời lưu trên máy; web không tính gì.
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, Hand, ScanFace, ScanSearch } from "lucide-react";
import { useChu } from "@/components/cms/DauCms";
import Link from "@/components/khung/Lien";
import { DauMang } from "@/components/huyen-hoc/KhungMang";
import { KhungChat } from "@/components/hoi/KhungChat";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { Button } from "@/components/ui/button";
import { BanDoMat } from "@/components/nhan-tuong/BanDoMat";
import { BaoCaoNhanTuong } from "@/components/nhan-tuong/BaoCaoNhanTuong";
import { AnhChanDung } from "@/components/nhan-tuong/AnhChanDung";
import { KhaoSatGuong } from "@/components/nhan-tuong/KhaoSatGuong";
import { MA_CAU_PHI_ANH, PopupCauHoiPhu } from "@/components/nhan-tuong/PopupCauHoiPhu";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { hoiMang } from "@/lib/hoi-mang";
import { laSoTuHoSo, useHoSo } from "@/lib/hoso";
import { demTraLoi, laVung, luuTraLoi, useTraLoi, type BaoCaoNhanTuong as Bc, type KhaoSat, type TraLoi } from "@/lib/nhan-tuong";
import { Dam, useChuNhanTuong } from "@/components/nhan-tuong/chu-nhan-tuong";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";
import { useDuong } from "@/components/khung/NgonNgu";

// EN-ALL GĐ 8: /en/face-reading là rewrite của trang này (một cây component) — chữ cố định ở lib/chu/nhan-tuong.ts (chiều
// `en`), câu khảo sát / bộ vị / bài đọc do engine trả theo ngôn ngữ. Bản Anh không có: khung hỏi đáp (engine chưa hiểu câu
// tiếng Anh), máy AI gợi ý từ ảnh (tắt ở bản Anh), lối sang Chỉ tay (chưa mở bản Anh).

/** Tên cụm bộ vị bản Anh (lib/so-trang-en.ts CUM_EN). */
const CUM_TEN_EN = "The areas of the face";

const GOI_Y = [
  { nhom: "Một vùng", cau: ["Ấn Đường rộng nghĩa là gì?", "Sơn Căn thấp thì sao?", "Pháp Lệnh đâm vào mép là gì?"] },
  { nhom: "Nốt ruồi", cau: ["Nốt ruồi ở cằm?", "Nốt ruồi trong lông mày?"] },
  { nhom: "Tuổi", cau: ["Năm nay tuổi 35 xem ở đâu?"] },
];

export function NhanTuong() {
  const c = useChu();
  const { t, en } = useChuNhanTuong();
  const d = useDuong();
  const hoSo = useHoSo();
  const traLoi = useTraLoi();
  const [ks, setKs] = useState<KhaoSat | null>(null);
  const [loiKs, setLoiKs] = useState<string | null>(null);
  const [bc, setBc] = useState<Bc | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [vungHoi, setVungHoi] = useState<string[]>([]);
  const [moPopup, setMoPopup] = useState(false);
  const [tlChoPopup, setTlChoPopup] = useState<TraLoi | null>(null);
  const [soDoMat, setSoDoMat] = useState<Record<string, unknown> | null>(null);
  const refBaiDoc = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetch(urlTheoNgonNgu("/api/nhan-tuong/khao-sat")).then((r) => (r.ok ? r.json() : Promise.reject(new Error("x")))).then((d) => setKs(d as KhaoSat))
      .catch(() => setLoiKs(t("loi.ks")));
  }, [t]);
  useBatDauDoc("nhantuong", Boolean(bc));
  const soCau = demTraLoi(traLoi);
  const namSinh = hoSo?.nam && hoSo.nam >= 1900 ? hoSo.nam : undefined;
  const cauPhiAnh = useMemo(
    () => (ks?.cau_hoi ?? []).filter((q) => (MA_CAU_PHI_ANH as readonly string[]).includes(q.ma)),
    [ks],
  );
  const soCauPhiAnhThieu = useMemo(
    () => cauPhiAnh.filter((q) => !traLoi?.[q.ma] || traLoi[q.ma] === "khong_chac").length,
    [cauPhiAnh, traLoi],
  );
  const moCauHoiPhu = () => {
    setTlChoPopup(traLoi ?? {});
    setMoPopup(true);
  };

  // NT-2: `tl` truyền thẳng khi vừa điền từ số đo ảnh (state traLoi chưa kịp cập nhật).
  const docVoi = async (tl: TraLoi | undefined, soDo?: Record<string, unknown> | null) => {
    if (!tl || dang) return;
    setDang(true); setLoi(null);
    try {
      const laSo = laSoTuHoSo(hoSo);
      const sd = soDo ?? soDoMat;
      const body = { tra_loi: tl, ...(hoSo?.nam && hoSo.thang && hoSo.ngay && hoSo.am == null ? { ngay_sinh: `${hoSo.nam}-${String(hoSo.thang).padStart(2, "0")}-${String(hoSo.ngay).padStart(2, "0")}` } : namSinh ? { nam_sinh: namSinh } : {}),
        ...(hoSo?.gioi_tinh ? { gioi_tinh: hoSo.gioi_tinh } : {}), ...(laSo ? { la_so: laSo } : {}), ...(sd ? { so_do_mat: sd } : {}) };
      const d = await postJson<Bc>("/api/nhan-tuong/luan-giai", body);
      setBc(d);
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "bai_doc", so_cau: demTraLoi(tl), ngu_hinh: d.da_tinh?.ngu_hinh?.hinh });
      setTimeout(() => refBaiDoc.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setLoi(e instanceof Error ? e.message : t("loi.doc")); } finally { setDang(false); }
  };
  const xemBaiDoc = () => void docVoi(traLoi);
  // Nút 1-click "Dùng N nét và xem bài đọc": lưu lựa chọn đã xác nhận và vào thẳng bài đọc Đông – Tây không chặn modal.
  // 4 câu phi hình ảnh (giọng nói, dáng đi, cốt nhục, chẩm cốt) hiện thành lối bổ sung nhanh tuỳ chọn ngay trên báo cáo.
  const dungVaXem = (tl: TraLoi, soDo?: Record<string, unknown> | null) => {
    luuTraLoi(tl);
    if (soDo) setSoDoMat(soDo);
    void docVoi(tl, soDo);
  };
  const xongPopup = (boSung: TraLoi) => {
    const gop: TraLoi = { ...(tlChoPopup ?? traLoi ?? {}), ...boSung };
    setMoPopup(false);
    setTlChoPopup(null);
    luuTraLoi(gop);
    void docVoi(gop);
  };

  const dau = (
    <>
      <DauMang Icon={ScanFace} hinh="nhan-tuong" ten={t("dau.ten")} mo_ta={t("dau.mo_ta")} />
      {/* RS-2: lối vào hai trang cùng mảng ngay đầu trang (trước chỉ có một dòng ở cuối trang). */}
      {!en && (
        <nav aria-label="Cùng mảng Nhân tướng" className="mx-auto -mt-4 mb-8 flex max-w-5xl flex-wrap gap-2 text-sm" data-testid="nt-loi-vao">
          <Link href="/chi-tay" className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-gold hover:bg-gold/10">
            <Hand className="size-4" aria-hidden /> Xem chỉ tay theo sách xưa
          </Link>
          <Link href="/nhan-tuong/do-hinh" className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-gold hover:bg-gold/10">
            <BookOpen className="size-4" aria-hidden /> Đồ hình tướng mặt trên bản khắc gỗ
          </Link>
        </nav>
      )}
    </>
  );
  // ANH-1: tải ảnh chân dung đứng ngay dưới đầu trang (chỉ khi chưa có bài đọc); gợi ý điền vào khảo sát trên máy.
  const anhChanDung = !bc && traLoi !== undefined && (
    <AnhChanDung ks={ks} daTraLoi={traLoi} onGoiY={luuTraLoi} onXem={xemBaiDoc} onDungVaXem={dungVaXem}
      onXongDo={(kqDo) => { setSoDoMat(kqDo.so_do as Record<string, unknown>); }}
      onMoCauHoiPhu={moCauHoiPhu} soCauPhiAnhThieu={soCauPhiAnhThieu}
      dangXem={dang} />
  );
  // Khối bản đồ không cần dữ liệu người dùng → render cả ở máy chủ (HTML có sẵn hình + lời dẫn khi chờ hồ sơ / lúc không JS).
  const banDo = !bc && (
        <section aria-labelledby="ban-do" className="mx-auto mb-10 max-w-5xl">
          <TieuDeMuc id="ban-do" nho={c("ban_do.nho")} lon={c("ban_do.lon")} />
          <div className="glass grid gap-6 rounded-2xl p-5 sm:p-6 lg:grid-cols-[18rem_1fr] lg:items-center">
            <BanDoMat en={en} nhan={Object.fromEntries(Object.values(ks?.bo_vi ?? {}).map((b) => [b.vung, b.ten]))} chuThich={false} sang={vungHoi} />
            {en ? (
              <div className="space-y-3 text-sm text-fg-muted">
                <p><Dam s={t("ban_do.p1")} /></p>
                <p><Dam s={t("ban_do.p2")} /></p>
                <p className="text-xs text-fg-faint">{t("ban_do.p3")}</p>
                {soCau > 0 && <Button onClick={xemBaiDoc} disabled={dang} size="sm" data-testid="nut-xem-lai-bai-doc">{dang ? t("ban_do.dang_doc") : t("ban_do.xem_lai", { so: String(soCau) })}</Button>}
              </div>
            ) : <div className="space-y-3 text-sm text-fg-muted">
              <p>Hệ thống kết hợp <b className="text-fg">Nhân tướng Đông phương</b> (ba đình, ngũ quan, mười hai cung, 100 vị trí lưu niên) và <b className="text-fg">Nhân tướng Ngũ Hành Phương Tây</b> (Lillian Bridges) — tự động đo 478 điểm mốc 3D ngay trên máy bạn.</p>
              <p>Quét gương mặt hoặc tải ảnh ở trên để hệ thống tự tính hầu hết các nét tướng mà không cần trả lời khảo sát thủ công; chỉ giọng nói và dáng đi (không có trong ảnh) sẽ hiện hộp hỏi nhanh tuỳ chọn.</p>
              <p className="text-xs text-fg-faint">Ảnh chỉ xử lý ngay trong trình duyệt, không gửi đi đâu. Màu trên bản đồ hiện sau khi đo hoặc trả lời.</p>
              {soCau > 0 && <Button onClick={xemBaiDoc} disabled={dang} size="sm" data-testid="nut-xem-lai-bai-doc">{dang ? "Đang đọc…" : `Xem bài đọc Đông – Tây (${soCau} nét đã tính)`}</Button>}
            </div>}
          </div>
        </section>
      );
  if (hoSo === undefined || traLoi === undefined) return <div>{dau}{banDo}<KhungTai /></div>;

  return (
    <div>
      {dau}
      {anhChanDung}
      {banDo}

      <PopupCauHoiPhu
        mo={moPopup}
        cauHoi={cauPhiAnh}
        traLoiHienTai={tlChoPopup ?? traLoi}
        soCauTuDong={demTraLoi(tlChoPopup ?? traLoi)}
        en={en}
        dangTai={dang}
        onXong={xongPopup}
        onDong={() => setMoPopup(false)}
      />

      <section aria-labelledby="khao-sat" id="khao-sat" className="mx-auto mb-10 max-w-5xl scroll-mt-24">
        {bc ? (
          <details className="group rounded-2xl border border-line/70 bg-surface/40 p-4 sm:p-5" data-testid="khao-sat-thu-gon">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-fg">
              <span>{en ? "Optional: Edit or inspect individual facial traits manually" : "Tuỳ chọn: Xem lại hoặc chỉnh tay từng nét trong khảo sát"}</span>
              <ChevronDown className="size-4 text-fg-faint transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-4">
              {loiKs && <BaoLoi loi={loiKs} thuLai={() => location.reload()} />}
              {!ks && !loiKs && <KhungTai />}
              {ks && <KhaoSatGuong ks={ks} traLoi={traLoi} onXong={xemBaiDoc} dangTai={dang} />}
            </div>
          </details>
        ) : (
          <>
            <TieuDeMuc id="khao-sat" nho={c("khao_sat.nho")} lon={c("khao_sat.lon")} />
            {loiKs && <BaoLoi loi={loiKs} thuLai={() => location.reload()} />}
            {!ks && !loiKs && <KhungTai />}
            {ks && <KhaoSatGuong ks={ks} traLoi={traLoi} onXong={xemBaiDoc} dangTai={dang} />}
          </>
        )}
        {loi && <div className="mt-4"><BaoLoi loi={loi} thuLai={xemBaiDoc} /></div>}
      </section>

      {bc && ks && (
        <section ref={refBaiDoc} aria-labelledby="bai-doc" id="bai-doc" className="mx-auto mb-10 max-w-5xl scroll-mt-24">
          <TieuDeMuc id="bai-doc" nho={c("bai_doc.nho")} lon={c("bai_doc.lon")} />
          <BaoCaoNhanTuong bc={bc} boVi={ks.bo_vi} ten={hoSo?.ho_ten?.trim() ? hoSo.ho_ten : t("ten_ban")}
            onMoCauHoiPhu={moCauHoiPhu} soCauPhiAnhThieu={soCauPhiAnhThieu} />
          <div className="mt-6">
            <CuoiBaiDoc moDun="nhantuong" cauHoi={t("cuoi.hoi")} khongCta={en} />
          </div>
        </section>
      )}

      <section aria-labelledby="hoi-dap" id="hoi-dap" className="mx-auto max-w-5xl scroll-mt-24">
        <TieuDeMuc id="hoi-dap" nho={c("hoi.nho")} lon={c("hoi.lon")} />
        {en ? <p className="text-sm text-fg-muted" data-testid="nt-hoi-chua-co">
          {t("hoi.chua_co")} <Link href={d("/nhan-tuong/bo-vi")} className="text-gold underline underline-offset-2">{CUM_TEN_EN}</Link>.
        </p> : <>
        <KhungChat moDun="nhantuong" goiY={GOI_Y}
          loiChao={soCau ? "Hỏi về một vùng trên mặt bạn — mình đọc theo điều bạn đã tự quan sát. Nốt ruồi, tuổi lưu niên, cung nào nói về gì cũng hỏi được." : "Hỏi về một vùng trên mặt (trán, mày, mắt, mũi, miệng, cằm…), nốt ruồi hay tuổi lưu niên. Làm Khảo sát để có lời riêng. Mình không xem tướng người khác."}
          gui={(cau) => hoiMang<{ cau_tra_loi?: string; vung?: string[] }>("/api/nhan-tuong/hoi",
            { cau_hoi: cau, tra_loi: traLoi, ...(namSinh ? { nam_sinh: namSinh } : {}), ...(hoSo?.gioi_tinh ? { gioi_tinh: hoSo.gioi_tinh } : {}) },
            (d) => { setVungHoi((d.vung ?? []).filter(laVung)); return undefined; })} />
        {vungHoi.length > 0 && !bc && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-fg-faint"><ScanSearch className="size-3.5" aria-hidden /> Vùng vừa hỏi đang sáng trên bản đồ phía trên.</p>
        )}
        </>}
      </section>

      {!en && <p className="mx-auto mt-8 max-w-5xl text-sm text-fg-muted" data-testid="nt-den-chi-tay">
        Xem thêm bàn tay: <Link href="/chi-tay" className="text-gold underline underline-offset-2">Xem chỉ tay theo sách xưa</Link> — chụp
        lòng bàn tay (ảnh không rời máy) để thấy tám cung trên tay mình, hoặc chọn hình vân giống tay mình.
      </p>}
    </div>
  );
}
