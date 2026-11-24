// GET /og/li-xi?khung=ngang|vuong|doc&mau=…&hoa=…&ma=…&tai=1 — Social Share Studio LÌ XÌ TẾT 2027.
// 3 khổ ảnh PNG chuẩn Social Việt Nam:
//   - ngang: 1200×630 (link preview Facebook / Zalo / Messenger)
//   - vuong: 1080×1080 (bài đăng Facebook / Zalo Feed)
//   - doc:   1080×1920 (Story 9:16 Instagram / Facebook / TikTok / Zalo)
// Chống lạm dụng: KHÔNG nhận tên / lời chúc tự do từ query string — mọi chữ cá nhân hoá đọc từ DB theo mã `ma` hợp lệ.
// Zero-PII: tuyệt đối không ngày sinh.
import { ImageResponse } from "next/og";
import { napPhong } from "@/lib/og-chung";
import { docLiXi } from "@/lib/li-xi-may-chu";
import { hoaTietTheoMa, MA_LI_XI_RE, mauThiepTheoMa, type KhungSocial } from "@/lib/li-xi-tet";

export const runtime = "nodejs";

const KICH_THUOC: Record<KhungSocial, { width: number; height: number }> = {
  ngang: { width: 1200, height: 630 },
  vuong: { width: 1080, height: 1080 },
  doc: { width: 1080, height: 1920 },
};

function SvgLinhVat({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="60" cy="60" r="46" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 4" />
      <path d="M22,82 Q35,74 48,82 T74,82 T98,82" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M44,44 C36,30 22,28 20,40 C19,48 27,52 33,47 C36,44 37,39 34,37" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M76,44 C84,30 98,28 100,40 C101,48 93,52 87,47 C84,44 83,39 86,37" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M46,45 C52,40 68,40 74,45 L79,57 C80,64 74,73 60,76 C46,73 40,64 41,57 Z" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2.2" />
      <circle cx="60" cy="24" r="3.5" fill={color} />
    </svg>
  );
}

function SvgPhaoHoa({ color, size }: { color: string; size: number }) {
  const tia = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {tia.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 60 + Math.cos(rad) * 18;
        const y1 = 60 + Math.sin(rad) * 18;
        const x2 = 60 + Math.cos(rad) * 44;
        const y2 = 60 + Math.sin(rad) * 44;
        const cx = 60 + Math.cos(rad) * 51;
        const cy = 60 + Math.sin(rad) * 51;
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="2.8" fill="#fef08a" />
          </g>
        );
      })}
      <circle cx="60" cy="60" r="6" fill={color} />
    </svg>
  );
}

function SvgHoaXuan({ loai, size }: { loai: "mai" | "dao"; size: number }) {
  const canh = loai === "mai" ? "#fde047" : "#fda4af";
  const nhi = loai === "mai" ? "#ea580c" : "#f59e0b";
  const bong = [
    { x: 34, y: 34, r: 11 },
    { x: 76, y: 26, r: 9 },
    { x: 58, y: 68, r: 10 },
    { x: 102, y: 52, r: 8 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 130 110">
      <path d="M4,98 C28,74 52,58 84,42 C98,35 112,26 124,18" fill="none" stroke={canh} strokeWidth="2.5" strokeLinecap="round" />
      {bong.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y - b.r * 0.55} r={b.r * 0.42} fill={canh} />
          <circle cx={b.x + b.r * 0.52} cy={b.y - b.r * 0.16} r={b.r * 0.42} fill={canh} />
          <circle cx={b.x + b.r * 0.32} cy={b.y + b.r * 0.46} r={b.r * 0.42} fill={canh} />
          <circle cx={b.x - b.r * 0.32} cy={b.y + b.r * 0.46} r={b.r * 0.42} fill={canh} />
          <circle cx={b.x - b.r * 0.52} cy={b.y - b.r * 0.16} r={b.r * 0.42} fill={canh} />
          <circle cx={b.x} cy={b.y} r={b.r * 0.24} fill={nhi} />
        </g>
      ))}
    </svg>
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ma = url.searchParams.get("ma") ?? "";
  const khungRaw = url.searchParams.get("khung") ?? "ngang";
  const khung: KhungSocial = khungRaw === "doc" || khungRaw === "vuong" ? khungRaw : "ngang";
  const tai = url.searchParams.get("tai") === "1";

  const d = MA_LI_XI_RE.test(ma) ? await docLiXi(ma) : { co: false };
  const thiep = mauThiepTheoMa(d.co ? d.mau_thiep : url.searchParams.get("mau"));
  const hoa = hoaTietTheoMa(url.searchParams.get("hoa"), thiep.ma);
  const ten = d.co && d.ten_nguoi_tang ? d.ten_nguoi_tang.trim().slice(0, 40) : "";
  const chuc = (d.co && d.loi_chuc ? d.loi_chuc.trim().slice(0, 140) : "") ||
    "Chúc năm Đinh Mùi 2027 vạn sự hanh thông, tâm an trí sáng, mọi quyết định lớn đều đúng thời điểm.";

  const { width, height } = KICH_THUOC[khung];
  const doc = khung === "doc";
  const vuong = khung === "vuong";
  const fonts = await napPhong();

  const img = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          fontFamily: "Sans",
          color: thiep.chu,
          background: `radial-gradient(circle at 22% 24%, ${thiep.nenChinh} 0%, ${thiep.nenPhu} 80%)`,
          padding: doc ? 56 : 44,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            border: `2.5px solid ${thiep.vien}`,
            borderRadius: 28,
            padding: doc ? "64px 56px" : vuong ? "52px 54px" : "40px 50px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Hàng trên: Nhãn thương hiệu + Con dấu triện ĐINH MÙI 2027 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", fontSize: doc ? 26 : 20, letterSpacing: 6, color: thiep.nhan, fontWeight: 700 }}>
                LÌ XÌ TẾT 2027
              </div>
              <div style={{ display: "flex", fontSize: doc ? 20 : 16, color: thiep.chu, opacity: 0.78 }}>
                Đinh Mùi · Thiên Hà Thuỷ · hieuban.com
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#991b1b",
                border: `2px solid ${thiep.vien}`,
                borderRadius: 12,
                padding: doc ? "12px 20px" : "8px 16px",
                color: "#fef2f2",
              }}
            >
              <div style={{ display: "flex", fontSize: doc ? 20 : 15, fontWeight: 700, letterSpacing: 3 }}>ĐINH MÙI</div>
              <div style={{ display: "flex", fontSize: doc ? 18 : 14, color: "#fde68a", letterSpacing: 4 }}>2027</div>
            </div>
          </div>

          {/* Giữa: Biểu trưng Linh Vật / Hoa Xuân / Pháo Hoa + Lời chúc */}
          <div
            style={{
              display: "flex",
              flexDirection: doc ? "column" : "row",
              alignItems: "center",
              justifyContent: doc ? "center" : "space-between",
              gap: doc ? 48 : 36,
              width: "100%",
            }}
          >
            {/* Cụm đồ hoạ Tết nổi bật (Story 9:16 đưa lên trên làm tâm điểm; 1:1 & 16:9 đặt bên phải) */}
            {doc && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 18,
                  padding: "36px 44px",
                  borderRadius: 28,
                  border: `2px solid ${thiep.vien}`,
                  background: "rgba(0,0,0,0.22)",
                }}
              >
                {hoa === "linh_vat" && <SvgLinhVat color={thiep.nhan} size={260} />}
                {hoa === "hoa_mai" && <SvgHoaXuan loai="mai" size={260} />}
                {hoa === "hoa_dao" && <SvgHoaXuan loai="dao" size={260} />}
                {hoa === "phao_hoa" && <SvgPhaoHoa color={thiep.nhan} size={260} />}
                <div style={{ display: "flex", fontSize: 22, color: thiep.nhan, letterSpacing: 3, fontWeight: 700 }}>
                  {hoa === "linh_vat" ? "KIM DƯƠNG ĐINH MÙI" : hoa === "hoa_mai" ? "MAI VÀNG PHÚ QUÝ" : hoa === "hoa_dao" ? "ĐÀO XUÂN AN KHANG" : "PHÁO HOA GIAO THỪA"}
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: doc ? "center" : "flex-start",
                gap: doc ? 28 : 20,
                width: doc ? "100%" : vuong ? 560 : 760,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "Serif",
                  fontSize: doc ? 68 : vuong ? 56 : 50,
                  lineHeight: 1.18,
                  color: thiep.chu,
                  textAlign: doc ? "center" : "left",
                }}
              >
                {ten ? `${ten} gửi bạn Bao Lì Xì Tết 2027` : "Mở Bao LÌ XÌ TẾT 2027 của bạn"}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: doc ? 34 : vuong ? 28 : 24,
                  lineHeight: 1.48,
                  color: thiep.chu,
                  opacity: 0.92,
                  textAlign: doc ? "center" : "left",
                }}
              >
                “{chuc}”
              </div>
            </div>

            {!doc && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                  padding: vuong ? 26 : 20,
                  borderRadius: 24,
                  border: `1.5px solid ${thiep.vien}`,
                  background: "rgba(0,0,0,0.22)",
                  width: vuong ? 290 : 250,
                }}
              >
                {hoa === "linh_vat" && <SvgLinhVat color={thiep.nhan} size={vuong ? 190 : 148} />}
                {hoa === "hoa_mai" && <SvgHoaXuan loai="mai" size={vuong ? 190 : 148} />}
                {hoa === "hoa_dao" && <SvgHoaXuan loai="dao" size={vuong ? 190 : 148} />}
                {hoa === "phao_hoa" && <SvgPhaoHoa color={thiep.nhan} size={vuong ? 190 : 148} />}
                <div style={{ display: "flex", fontSize: 14, color: thiep.nhan, letterSpacing: 2, fontWeight: 700, textAlign: "center" }}>
                  {hoa === "linh_vat" ? "KIM DƯƠNG ĐINH MÙI" : hoa === "hoa_mai" ? "MAI VÀNG PHÚ QUÝ" : hoa === "hoa_dao" ? "ĐÀO XUÂN AN KHANG" : "PHÁO HOA GIAO THỪA"}
                </div>
              </div>
            )}
          </div>

          {/* Hàng dưới: Điểm nhấn Báo cáo 2027 + CTA */}
          <div
            style={{
              display: "flex",
              flexDirection: doc ? "column" : "row",
              justifyContent: "space-between",
              alignItems: doc ? "flex-start" : "center",
              gap: doc ? 24 : 16,
              borderTop: `1.5px solid ${thiep.vien}`,
              paddingTop: doc ? 32 : 20,
            }}
          >
            <div style={{ display: "flex", fontSize: doc ? 26 : 20, color: thiep.nhan, lineHeight: 1.4 }}>
              Mở trọn Báo cáo Năm 2027 · Công việc · Tiền bạc · Gia đình · Sức khoẻ · 12 Tháng
            </div>
            <div
              style={{
                display: "flex",
                background: thiep.vien,
                color: thiep.nenPhu,
                fontWeight: 700,
                fontSize: doc ? 28 : 21,
                padding: doc ? "18px 34px" : "12px 26px",
                borderRadius: 999,
              }}
            >
              Mở Lì Xì 2027 →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts,
      ...(tai ? { headers: { "content-disposition": `attachment; filename="li-xi-tet-2027-${khung}.png"` } } : {}),
    },
  );
  return img;
}
