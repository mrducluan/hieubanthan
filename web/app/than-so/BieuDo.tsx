import type { MoRong } from "@/lib/engine";

// Biểu đồ ngày sinh (lưới 3×3: 3-6-9 / 2-5-8 / 1-4-7) + mũi tên + chỉ số phụ.
// Chỉ hiển thị dữ liệu engine trả về — web không tự tính gì.

const O = [[3, 6, 9], [2, 5, 8], [1, 4, 7]];
const VI_TRI_NO: Record<string, string> = {
  ngay_sinh: "ngày sinh", duong_doi: "số chủ đạo", su_menh: "sứ mệnh",
  linh_hon: "linh hồn", nhan_cach: "nhân cách",
};

export function BieuDo({ mo }: { mo: MoRong }) {
  const bd = mo.bieu_do;
  const tcn = mo.thang_ca_nhan;
  return (
    <div className="depth" data-testid="bieu-do">
      <div className="section-label">Biểu đồ ngày sinh & chỉ số phụ</div>
      <p className="intro">
        Lưới xếp các chữ số trong ngày sinh (bỏ số 0). Ô có số là điều được nhấn, ô trống là
        điều cần học thêm; ba ô thẳng hàng tạo thành “mũi tên”. Tên gọi khác nhau tuỳ sách.
      </p>

      <div className="bd-wrap">
        <div className="bd-grid" role="table" aria-label="Biểu đồ ngày sinh">
          {O.map((hang, i) => (
            <div className="bd-row" role="row" key={i}>
              {hang.map((so, j) => {
                const n = bd.luoi[i]?.[j] ?? 0;
                return (
                  <div role="cell" key={so} className={n ? "bd-cell" : "bd-cell bd-empty"}
                    aria-label={`Số ${so}: ${n} lần`}>
                    {n ? String(so).repeat(n) : <span className="bd-ghost">{so}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bd-arrows">
          {bd.mui_ten.length === 0 && (
            <p className="bd-note">Ngày sinh này không tạo thành mũi tên đủ hay trống nào.</p>
          )}
          {bd.mui_ten.map((m) => (
            <div className="phase" key={`${m.ma}-${m.trong}`}>
              <div className="phase-top">
                <strong>{m.ten ?? m.ma}</strong>
                <span className="tag">{m.ma}</span>
              </div>
              {m.y_nghia && <p>{m.y_nghia}</p>}
              {m.trong ? (m.goi_y && <p className="how">Gợi ý: {m.goi_y}</p>)
                : (m.mat_toi && <p className="dark">Mặt tối: {m.mat_toi}</p>)}
            </div>
          ))}
          {bd.so_thieu.length > 0 && (
            <p className="bd-note">Số vắng trong ngày sinh: {bd.so_thieu.join(", ")}</p>
          )}
        </div>
      </div>

      <div className="phase-cards">
        {mo.so_ngay_sinh.nghia && (
          <div className="phase"><div className="phase-top"><strong>Số ngày sinh</strong>
            <span className="tag">số {mo.so_ngay_sinh.so}</span></div><p>{mo.so_ngay_sinh.nghia}</p></div>
        )}
        {mo.so_thai_do.nghia && (
          <div className="phase"><div className="phase-top"><strong>Số thái độ — ấn tượng đầu tiên</strong>
            <span className="tag">số {mo.so_thai_do.so}</span></div><p>{mo.so_thai_do.nghia}</p></div>
        )}
        {mo.so_truong_thanh.nghia && (
          <div className="phase"><div className="phase-top"><strong>Số trưởng thành — hướng đời về sau</strong>
            <span className="tag">số {mo.so_truong_thanh.so}</span></div><p>{mo.so_truong_thanh.nghia}</p></div>
        )}
        {tcn.nghia && (
          <div className="phase"><div className="phase-top">
            <strong>Tháng {tcn.thang}/{tcn.nam} — {tcn.nghia.chu_de}</strong>
            <span className="tag">tháng cá nhân {tcn.so}</span></div>
            <p className="do-avoid"><span className="do">Nên:</span> {tcn.nghia.nen}{" · "}
              <span className="avoid">Tránh:</span> {tcn.nghia.tranh}</p></div>
        )}
        {mo.no_nghiep.map((n) => n.nghia && (
          <div className="phase" key={`${n.vi_tri}-${n.so}`}><div className="phase-top">
            <strong>{n.nghia.ten}</strong><span className="tag">ở {VI_TRI_NO[n.vi_tri] ?? n.vi_tri}</span></div>
            <p>{n.nghia.y_nghia}</p><p className="how">Gợi ý: {n.nghia.goi_y}</p></div>
        ))}
        {mo.bai_hoc_nghiep.length > 0 && (
          <div className="phase"><div className="phase-top"><strong>Bài học từ tên</strong>
            <span className="tag">số vắng: {mo.bai_hoc_nghiep.map((b) => b.so).join(", ")}</span></div>
            {mo.bai_hoc_nghiep.map((b) => b.nghia && <p key={b.so}>{b.nghia}</p>)}</div>
        )}
      </div>
      <p className="src" style={{ marginTop: 10 }}>
        Nguồn: {mo.trich_nguon}{mo.trang_thai === "nhap_ai" ? " · bản nháp, đang được duyệt dần" : ""}
      </p>
    </div>
  );
}
