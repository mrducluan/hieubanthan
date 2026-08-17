import Link from "next/link";
import { luanGiai, EngineError, type LuanGiaiResult } from "@/lib/engine";
import { PinnacleArc } from "./PinnacleArc";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

const TEN_VI_TRI: Record<string, string> = {
  duong_doi: "Đường đời",
  su_menh: "Sứ mệnh",
  linh_hon: "Linh hồn",
  nhan_cach: "Nhân cách",
};

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function ThanSoPage({ searchParams }: Props) {
  const ten1 = str(searchParams.ten1);
  const ten2 = str(searchParams.ten2);
  const ngay = Number(str(searchParams.ngay));
  const thang = Number(str(searchParams.thang));
  const nam = Number(str(searchParams.nam));
  const daNhap = ten1 !== "" && ngay > 0 && thang > 0 && nam > 0;

  let kq: LuanGiaiResult | null = null;
  let loi: string | null = null;
  if (daNhap) {
    try {
      kq = await luanGiai({ ho_ten: ten2 ? [ten1, ten2] : [ten1], ngay, thang, nam });
    } catch (e) {
      loi = e instanceof EngineError ? e.message : "Có lỗi không xác định.";
    }
  }

  const cs = kq?.chieu_sau;
  const currentAge = cs?.nam_ca_nhan?.[0]?.tuoi ?? 0;

  return (
    <main>
      <Link href="/" className="backlink">← Trang chủ</Link>

      <header className="page-head">
        <span className="eyebrow">Thần số học · tham khảo văn hoá</span>
        <h1>Con số của bạn</h1>
        <p className="lede">
          Nhập tên theo nhiều cách viết nếu bạn dùng nhiều biến thể (khai sinh,
          thường gọi). Mỗi con số luôn kèm mặt tối và một câu để bạn tự kiểm —
          điều hầu hết trang khác giấu đi.
        </p>
      </header>

      <form method="get" className="reading-form">
        <label className="field">
          <span>Họ tên (bản chính)</span>
          <input name="ten1" defaultValue={ten1} required placeholder="Nguyễn Văn An" />
        </label>
        <label className="field">
          <span>Biến thể khác (không bắt buộc)</span>
          <input name="ten2" defaultValue={ten2} placeholder="Nguyen Van An" />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Ngày</span>
            <input name="ngay" type="number" min={1} max={31} required defaultValue={ngay || ""} />
          </label>
          <label className="field">
            <span>Tháng</span>
            <input name="thang" type="number" min={1} max={12} required defaultValue={thang || ""} />
          </label>
          <label className="field">
            <span>Năm</span>
            <input name="nam" type="number" min={1900} max={2100} required defaultValue={nam || ""} />
          </label>
        </div>
        <button type="submit" className="btn-primary">Xem con số</button>
      </form>

      {loi && <p className="notice-error">{loi}</p>}

      {kq && (
        <section className="result">
          <div className="result-head">
            <span className="who">{kq.ten_chinh}</span>
            <span className="meta">Sinh {kq.ngay_sinh} · {kq.tom_tat_do_tin}</span>
          </div>

          <p className="read-note">{kq.cach_doc}</p>

          <div className="section-label">Bốn con số cốt lõi</div>
          <div className="cards">
            {kq.cac_vi_tri.map((vt) => (
              <div className="card" key={vt.vi_tri}>
                <div className="card-top">
                  <div className="numeral">{vt.gia_tri}</div>
                  <div className="card-titles">
                    <span className="pos">{TEN_VI_TRI[vt.vi_tri] ?? vt.ten}</span>
                    {vt.nghia && <span className="kw">{vt.nghia.tu_khoa}</span>}
                    <span className="frame">{vt.khung}</span>
                  </div>
                  {vt.nghia?.so_cai && <span className="seal">số cái</span>}
                </div>
                {vt.nghia && (
                  <div className="card-body">
                    <p className="shadow-line"><b>Mặt tối:</b> {vt.nghia.mat_toi}</p>
                    <p className="probe">Tự kiểm — {vt.nghia.phan_chung}</p>
                    <p className="src">Nguồn: {vt.nghia.trich_nguon}</p>
                  </div>
                )}
                {vt.ghi_chu_do_nhay && <p className="sensitivity">ⓘ {vt.ghi_chu_do_nhay}</p>}
              </div>
            ))}
          </div>

          {cs && (
            <div className="depth">
              <div className="section-label">Chiều sâu</div>
              <p className="intro">{cs.cach_doc_chieu_sau}</p>

              <h3>Dải đời — bốn giai đoạn theo tuổi</h3>
              <PinnacleArc pinnacles={cs.dinh_cao} currentAge={currentAge} />
              <div className="phase-cards">
                {cs.dinh_cao.map((p) =>
                  p.nghia ? (
                    <div className="phase" key={p.dinh}>
                      <div className="phase-top">
                        <strong>{p.nghia.chu_de}</strong>
                        <span className="tag">
                          số {p.so} · {p.den_tuoi ? `${p.tu_tuoi}–${p.den_tuoi} tuổi` : `${p.tu_tuoi}+ tuổi`}
                        </span>
                      </div>
                      <p>{p.nghia.y_nghia}</p>
                      <p className="dark">Bóng tối: {p.nghia.bong_toi}</p>
                    </div>
                  ) : null,
                )}
              </div>

              {cs.thu_thach_chinh.nghia && (
                <>
                  <h3>Thử thách chính — bài học lặp lại</h3>
                  <div className="challenge">
                    <strong>Số {cs.thu_thach_chinh.so} — {cs.thu_thach_chinh.nghia.mo_ta}</strong>
                    <p>{cs.thu_thach_chinh.nghia.y_nghia}</p>
                    <p className="how">Cách vượt: {cs.thu_thach_chinh.nghia.cach_vuot}</p>
                  </div>
                </>
              )}

              <h3>Năm cá nhân — nhịp từng năm sắp tới</h3>
              <div className="years">
                {cs.nam_ca_nhan.map((n) =>
                  n.nghia ? (
                    <div className="year" key={n.nam}>
                      <div className="year-top">
                        <strong>{n.nam} — {n.nghia.chu_de}</strong>
                        <span className="tag">số {n.so} · {n.tuoi} tuổi</span>
                      </div>
                      <p>{n.nghia.y_nghia}</p>
                      <p className="do-avoid">
                        <span className="do">Nên:</span> {n.nghia.nen}{" · "}
                        <span className="avoid">Tránh:</span> {n.nghia.tranh}
                      </p>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}

          <p className="source-foot">{kq.trich_nguon_chung}</p>
          <p className="engine-foot">
            Engine v{kq.engine_version} · Tên đã quét: {kq.ten_bien_the_da_quet.join(", ")}
          </p>
        </section>
      )}
    </main>
  );
}
