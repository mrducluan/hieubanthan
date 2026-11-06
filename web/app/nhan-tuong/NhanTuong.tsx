"use client";
// NT-1 — trang công cụ Nhân tướng học (chủ dự án giao 2026-11-06). Phương án UI đã chọn: "Gương soi có hướng dẫn" —
// bản đồ gương mặt là nhân vật chính, khảo sát sáu bước sáng đúng vùng đang hỏi, bài đọc tám chương khuôn doi_song_1.
// Không ảnh (ảnh chỉ để tự chấm 4 điểm trên máy, không rời máy); câu trả lời lưu trên máy; web không tính gì.
import { useEffect, useRef, useState } from "react";
import { ScanFace, ScanSearch } from "lucide-react";
import { useChu } from "@/components/cms/DauCms";
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
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { hoiMang } from "@/lib/hoi-mang";
import { laSoTuHoSo, useHoSo } from "@/lib/hoso";
import { demTraLoi, laVung, luuTraLoi, useTraLoi, type BaoCaoNhanTuong as Bc, type KhaoSat } from "@/lib/nhan-tuong";

const GOI_Y = [
  { nhom: "Một vùng", cau: ["Ấn Đường rộng nghĩa là gì?", "Sơn Căn thấp thì sao?", "Pháp Lệnh đâm vào mép là gì?"] },
  { nhom: "Nốt ruồi", cau: ["Nốt ruồi ở cằm?", "Nốt ruồi trong lông mày?"] },
  { nhom: "Tuổi", cau: ["Năm nay tuổi 35 xem ở đâu?"] },
];

export function NhanTuong() {
  const c = useChu();
  const hoSo = useHoSo();
  const traLoi = useTraLoi();
  const [ks, setKs] = useState<KhaoSat | null>(null);
  const [loiKs, setLoiKs] = useState<string | null>(null);
  const [bc, setBc] = useState<Bc | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const [vungHoi, setVungHoi] = useState<string[]>([]);
  const refBaiDoc = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetch("/api/nhan-tuong/khao-sat").then((r) => (r.ok ? r.json() : Promise.reject(new Error("x")))).then((d) => setKs(d as KhaoSat))
      .catch(() => setLoiKs("Chưa tải được bộ câu hỏi — thử lại sau ít phút."));
  }, []);
  useBatDauDoc("nhantuong", Boolean(bc));
  const soCau = demTraLoi(traLoi);
  const namSinh = hoSo?.nam && hoSo.nam >= 1900 ? hoSo.nam : undefined;

  const xemBaiDoc = async () => {
    if (!traLoi || dang) return;
    setDang(true); setLoi(null);
    try {
      const laSo = laSoTuHoSo(hoSo);
      const body = { tra_loi: traLoi, ...(hoSo?.nam && hoSo.thang && hoSo.ngay && hoSo.am == null ? { ngay_sinh: `${hoSo.nam}-${String(hoSo.thang).padStart(2, "0")}-${String(hoSo.ngay).padStart(2, "0")}` } : namSinh ? { nam_sinh: namSinh } : {}),
        ...(hoSo?.gioi_tinh ? { gioi_tinh: hoSo.gioi_tinh } : {}), ...(laSo ? { la_so: laSo } : {}) };
      const d = await postJson<Bc>("/api/nhan-tuong/luan-giai", body);
      setBc(d);
      ghi("chart_interacted", { mo_dun: "nhantuong", kind: "bai_doc", so_cau: soCau, ngu_hinh: d.da_tinh?.ngu_hinh?.hinh });
      setTimeout(() => refBaiDoc.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đọc được lúc này."); } finally { setDang(false); }
  };

  const dau = (
    <DauMang Icon={ScanFace} ten="Nhân tướng học" chip
      mo_ta="Gương mặt kể gì về bạn? Tải một ảnh chân dung để máy gợi ý nét mặt (có thoả thuận, ảnh không lưu), hoặc đứng trước gương tự trả lời 31 câu theo sáu bước — trang ghép điều bạn thấy với cách đọc của sách tướng xưa thành bài đọc tám chương: dáng mặt theo năm hành, tính cách, việc và tiền, tình cảm, sức khoẻ, năm nay nhìn vào đâu, tướng và lá số, việc nên làm. Không điểm số, không xem tướng người khác." />
  );
  // ANH-1: tải ảnh chân dung đứng ngay dưới đầu trang (chỉ khi chưa có bài đọc); gợi ý điền vào khảo sát trên máy.
  const anhChanDung = !bc && traLoi !== undefined && (
    <AnhChanDung ks={ks} daTraLoi={traLoi} onGoiY={luuTraLoi} onXem={xemBaiDoc} dangXem={dang} />
  );
  // Khối bản đồ không cần dữ liệu người dùng → render cả ở máy chủ (HTML có sẵn hình + lời dẫn khi chờ hồ sơ / lúc không JS).
  const banDo = !bc && (
        <section aria-labelledby="ban-do" className="mx-auto mb-10 max-w-5xl">
          <TieuDeMuc id="ban-do" nho={c("ban_do.nho")} lon={c("ban_do.lon")} />
          <div className="glass grid gap-6 rounded-2xl p-5 sm:p-6 lg:grid-cols-[18rem_1fr] lg:items-center">
            <BanDoMat nhan={Object.fromEntries(Object.values(ks?.bo_vi ?? {}).map((b) => [b.vung, b.ten]))} chuThich={false} sang={vungHoi} />
            <div className="space-y-3 text-sm text-fg-muted">
              <p>Sách tướng xưa chia mặt thành <b className="text-fg">ba phần</b> (trán – mũi – cằm), <b className="text-fg">năm quan</b> (mày, mắt, tai, mũi, miệng) và <b className="text-fg">mười hai cung</b> — mỗi vùng gắn với một mảng đời: trán là công việc, mũi là tiền bạc, đuôi mắt là đôi lứa, cằm là hậu vận.</p>
              <p>Bạn tự soi gương và chọn điều mình thấy; trang không nhận diện tự động. Mỗi tuổi sách lại xem ở một vùng (<b className="text-fg">100 vị trí lưu niên</b>) — có năm sinh trong hồ sơ, bài đọc sẽ chỉ vùng của năm nay.</p>
              <p className="text-xs text-fg-faint">Gương mặt trên hình vẽ giản lược, không phải mặt của ai. Màu sẽ hiện sau khi bạn trả lời.</p>
              {soCau > 0 && <Button onClick={xemBaiDoc} disabled={dang} size="sm" data-testid="nut-xem-lai-bai-doc">{dang ? "Đang đọc…" : `Xem bài đọc với ${soCau} câu đã trả lời`}</Button>}
            </div>
          </div>
        </section>
      );
  if (hoSo === undefined || traLoi === undefined) return <div>{dau}{banDo}<KhungTai /></div>;

  return (
    <div>
      {dau}
      {anhChanDung}
      {banDo}

      <section aria-labelledby="khao-sat" id="khao-sat" className="mx-auto mb-10 max-w-5xl scroll-mt-24">
        <TieuDeMuc id="khao-sat" nho={c("khao_sat.nho")} lon={c("khao_sat.lon")} />
        {loiKs && <BaoLoi loi={loiKs} thuLai={() => location.reload()} />}
        {!ks && !loiKs && <KhungTai />}
        {ks && (
          <>
            {bc && <p className="mb-3 text-sm text-fg-muted">Đổi câu trả lời rồi bấm “Xem bài đọc” để đọc lại.</p>}
            <KhaoSatGuong ks={ks} traLoi={traLoi} onXong={xemBaiDoc} dangTai={dang} />
          </>
        )}
        {loi && <div className="mt-4"><BaoLoi loi={loi} thuLai={xemBaiDoc} /></div>}
      </section>

      {bc && ks && (
        <section ref={refBaiDoc} aria-labelledby="bai-doc" id="bai-doc" className="mx-auto mb-10 max-w-5xl scroll-mt-24">
          <TieuDeMuc id="bai-doc" nho={c("bai_doc.nho")} lon={c("bai_doc.lon")} />
          <BaoCaoNhanTuong bc={bc} boVi={ks.bo_vi} ten={hoSo?.ho_ten?.trim() ? hoSo.ho_ten : "bạn"} />
          <div className="mt-6">
            <CuoiBaiDoc moDun="nhantuong" cauHoi="Bài đọc này có nét nào bạn chưa từng để ý về mình?" />
          </div>
        </section>
      )}

      <section aria-labelledby="hoi-dap" id="hoi-dap" className="mx-auto max-w-5xl scroll-mt-24">
        <TieuDeMuc id="hoi-dap" nho={c("hoi.nho")} lon={c("hoi.lon")} />
        <KhungChat moDun="nhantuong" goiY={GOI_Y}
          loiChao={soCau ? "Hỏi về một vùng trên mặt bạn — mình đọc theo điều bạn đã tự quan sát. Nốt ruồi, tuổi lưu niên, cung nào nói về gì cũng hỏi được." : "Hỏi về một vùng trên mặt (trán, mày, mắt, mũi, miệng, cằm…), nốt ruồi hay tuổi lưu niên. Làm Khảo sát để có lời riêng. Mình không xem tướng người khác."}
          gui={(cau) => hoiMang<{ cau_tra_loi?: string; vung?: string[] }>("/api/nhan-tuong/hoi",
            { cau_hoi: cau, tra_loi: traLoi, ...(namSinh ? { nam_sinh: namSinh } : {}), ...(hoSo?.gioi_tinh ? { gioi_tinh: hoSo.gioi_tinh } : {}) },
            (d) => { setVungHoi((d.vung ?? []).filter(laVung)); return undefined; })} />
        {vungHoi.length > 0 && !bc && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-fg-faint"><ScanSearch className="size-3.5" aria-hidden /> Vùng vừa hỏi đang sáng trên bản đồ phía trên.</p>
        )}
      </section>
    </div>
  );
}
