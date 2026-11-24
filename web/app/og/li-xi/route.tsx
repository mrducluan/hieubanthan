// GET /og/li-xi?ma=… (hoặc ?mau=do_son cho ảnh mặc định của /li-xi-tet-2027) — Thẻ chia sẻ Zalo/Facebook 1200×630.
// Chống lạm dụng: KHÔNG nhận tên / lời chúc tự do từ query string — mọi chữ cá nhân hoá đọc từ DB theo mã `ma` hợp lệ.
// Zero-PII: chỉ hiện tên hiển thị người tặng (tuỳ chọn) + lời chúc đã lọc trong DB, tuyệt đối không ngày sinh.
import { ImageResponse } from "next/og";
import { napPhong } from "@/lib/og-chung";
import { docLiXi } from "@/lib/li-xi-may-chu";
import { MA_LI_XI_RE, mauThiepTheoMa } from "@/lib/li-xi-tet";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const d = MA_LI_XI_RE.test(ma) ? await docLiXi(ma) : { co: false };
  const thiep = mauThiepTheoMa(d.co ? d.mau_thiep : url.searchParams.get("mau"));
  const ten = d.co && d.ten_nguoi_tang ? d.ten_nguoi_tang.trim().slice(0, 40) : "";
  const chuc = (d.co && d.loi_chuc ? d.loi_chuc.trim().slice(0, 120) : "") ||
    "Chúc năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng, mọi quyết định lớn đều đúng thời điểm.";
  const fonts = await napPhong();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Sans",
          color: thiep.chu,
          background: `radial-gradient(circle at 22% 28%, ${thiep.nenChinh} 0%, ${thiep.nenPhu} 78%)`,
          padding: 44,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            border: `2px solid ${thiep.vien}`,
            borderRadius: 24,
            padding: "42px 52px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, color: thiep.nhan, textTransform: "uppercase" }}>
              LÌ XÌ BÁO CÁO TẾT · ĐINH MÙI 2027
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1.5px solid ${thiep.vien}`,
                borderRadius: 999,
                padding: "8px 20px",
                fontSize: 18,
                color: thiep.nhan,
              }}
            >
              hieuban.com
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 920 }}>
            <div style={{ display: "flex", fontFamily: "Serif", fontSize: 58, lineHeight: 1.15, color: thiep.chu }}>
              {ten ? `${ten} gửi bạn một Bao Lì Xì 2027` : "Bạn nhận được một Bao Lì Xì Tết 2027"}
            </div>
            <div style={{ display: "flex", fontSize: 28, lineHeight: 1.45, color: thiep.chu, opacity: 0.92 }}>
              “{chuc}”
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${thiep.vien}`, paddingTop: 22 }}>
            <div style={{ display: "flex", fontSize: 22, color: thiep.nhan }}>
              Mở trọn Báo cáo Năm 2027 · Công việc · Tiền bạc · Gia đình · Sức khoẻ · 12 Tháng
            </div>
            <div
              style={{
                display: "flex",
                background: thiep.vien,
                color: thiep.nenPhu,
                fontWeight: 700,
                fontSize: 22,
                padding: "12px 26px",
                borderRadius: 999,
              }}
            >
              Mở bao lì xì →
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
