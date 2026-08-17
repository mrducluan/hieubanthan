import Link from "next/link";
import { luanGiai, EngineError, type LuanGiaiResult } from "@/lib/engine";

export const dynamic = "force-dynamic";

// Form dùng GET thuần: submit đưa dữ liệu vào searchParams, trang render lại
// phía server và gọi engine. Không cần client JS, không lộ ENGINE_URL, và URL
// kết quả tự nhiên chia sẻ được.
interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

const TEN_CHI_SO: Record<string, string> = {
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
      kq = await luanGiai({
        ho_ten: ten2 ? [ten1, ten2] : [ten1],
        ngay,
        thang,
        nam,
      });
    } catch (e) {
      loi = e instanceof EngineError ? e.message : "Có lỗi không xác định.";
    }
  }

  return (
    <main>
      <p style={{ fontSize: 13 }}>
        <Link href="/" style={{ color: "#35695a" }}>← Trang chủ</Link>
      </p>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Thần số học</h1>
      <p style={{ color: "#44534a", maxWidth: "60ch", fontSize: 15 }}>
        Nhập tên theo nhiều cách viết nếu bạn dùng nhiều biến thể (khai sinh,
        thường gọi). Kết quả sẽ cho thấy chỉ số nào ổn định và chỉ số nào đổi
        theo quy ước — điều mà hầu hết trang khác giấu đi.
      </p>

      <form
        method="get"
        style={{
          display: "grid",
          gap: 10,
          marginTop: 20,
          padding: 20,
          background: "#fff",
          border: "1px solid #d5ddd6",
          borderRadius: 6,
        }}
      >
        <label style={{ fontSize: 14 }}>
          Họ tên (bản chính)
          <input
            name="ten1"
            defaultValue={ten1}
            required
            placeholder="Nguyễn Văn An"
            style={inputStyle}
          />
        </label>
        <label style={{ fontSize: 14 }}>
          Biến thể khác (không bắt buộc)
          <input
            name="ten2"
            defaultValue={ten2}
            placeholder="Nguyen Van An"
            style={inputStyle}
          />
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ fontSize: 14, flex: 1 }}>
            Ngày
            <input name="ngay" type="number" min={1} max={31} required
              defaultValue={ngay || ""} style={inputStyle} />
          </label>
          <label style={{ fontSize: 14, flex: 1 }}>
            Tháng
            <input name="thang" type="number" min={1} max={12} required
              defaultValue={thang || ""} style={inputStyle} />
          </label>
          <label style={{ fontSize: 14, flex: 1 }}>
            Năm
            <input name="nam" type="number" min={1900} max={2100} required
              defaultValue={nam || ""} style={inputStyle} />
          </label>
        </div>
        <button
          type="submit"
          style={{
            padding: "10px 16px",
            background: "#35695a",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Xem khoảng kết quả
        </button>
      </form>

      {loi && (
        <p style={{ marginTop: 18, padding: 14, background: "#f6e5e1",
                    border: "1px solid #d9a99e", borderRadius: 6, fontSize: 14 }}>
          {loi}
        </p>
      )}

      {kq && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20 }}>Kết quả — {kq.ngay_sinh}</h2>
          <p style={{ fontSize: 13, color: "#5b6a60", marginTop: 4 }}>
            {kq.tom_tat_do_tin}
          </p>
          <p style={{ fontSize: 13, color: "#44534a", background: "#e0ebe5",
                      border: "1px solid #b9d2c6", borderRadius: 6,
                      padding: "10px 14px", marginTop: 10, maxWidth: "62ch" }}>
            {kq.cach_doc}
          </p>

          <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
            {kq.cac_vi_tri.map((vt) => (
              <div
                key={vt.vi_tri}
                style={{
                  background: "#fff",
                  border: `1px solid ${vt.on_dinh ? "#9dbfb0" : "#d9c48f"}`,
                  borderLeft: `4px solid ${vt.on_dinh ? "#35695a" : "#8a6420"}`,
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "13px 18px",
                              borderBottom: vt.nghia.length ? "1px solid #eef2ee" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                                alignItems: "baseline" }}>
                    <strong style={{ fontSize: 16 }}>{TEN_CHI_SO[vt.vi_tri] ?? vt.ten}</strong>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>
                      {vt.gia_tri_co_the.join(" · ")}
                    </span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#7a877e" }}>
                    {vt.khung}
                  </p>
                  {vt.canh_bao && (
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#8a6420" }}>
                      ⚠ {vt.canh_bao}
                    </p>
                  )}
                </div>

                {vt.nghia.map((n) => (
                  <div key={n.gia_tri} style={{ padding: "12px 18px",
                          borderTop: "1px solid #f2f5f2" }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "#22493f" }}>
                      Số {n.gia_tri}{n.so_cai ? " (số cái)" : ""} — {n.tu_khoa}
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>
                      <strong style={{ color: "#9c4433" }}>Mặt tối:</strong> {n.mat_toi}
                    </p>
                    <p style={{ margin: "5px 0 0", fontSize: 13.5, fontStyle: "italic",
                                color: "#33424f" }}>
                      Tự kiểm: {n.phan_chung}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#7a877e" }}>
                      Nguồn: {n.trich_nguon}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: "#7a877e",
                      maxWidth: "62ch", lineHeight: 1.5 }}>
            {kq.trich_nguon_chung}
          </p>
          <p style={{ marginTop: 6, fontSize: 11.5, color: "#9aa69d" }}>
            Engine v{kq.engine_version} · Tên đã quét: {kq.ten_bien_the_da_quet.join(", ")}
          </p>
        </section>
      )}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "9px 11px",
  border: "1px solid #c2ccc4",
  borderRadius: 5,
  fontSize: 15,
  boxSizing: "border-box",
};
