import Link from "next/link";
import { doNhay, EngineError, type DoNhayResult } from "@/lib/engine";

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

  let kq: DoNhayResult | null = null;
  let loi: string | null = null;
  if (daNhap) {
    try {
      kq = await doNhay({
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
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {Object.entries(kq.khoang_ket_qua_co_the).map(([chiSo, giaTri]) => {
              const onDinh = giaTri.length === 1;
              return (
                <div
                  key={chiSo}
                  style={{
                    padding: "14px 18px",
                    background: "#fff",
                    border: `1px solid ${onDinh ? "#9dbfb0" : "#d9c48f"}`,
                    borderLeft: `4px solid ${onDinh ? "#35695a" : "#8a6420"}`,
                    borderRadius: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between",
                                alignItems: "baseline" }}>
                    <strong>{TEN_CHI_SO[chiSo] ?? chiSo}</strong>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>
                      {giaTri.join(" · ")}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#5b6a60" }}>
                    {onDinh
                      ? "Ổn định — mọi quy ước phiên âm đều cho cùng kết quả."
                      : `${giaTri.length} giá trị khả dĩ tuỳ quy ước phiên âm và cộng gộp. Cần chốt quy ước trước khi đọc luận chi tiết.`}
                  </p>
                </div>
              );
            })}
          </div>
          <p style={{ marginTop: 14, fontSize: 12, color: "#7a877e" }}>
            Engine v{kq.engine_version} · Tên đã quét:{" "}
            {kq.ten_bien_the_da_quet.join(", ")}
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
